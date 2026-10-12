//! Polls a private Google Calendar `.ics` URL and an IMAP inbox (App Password)
//! so the notch can show real event dots and an unread-mail count.
//!
//! Design constraints:
//! * No OAuth — the calendar URL is a long-lived secret (stored plain in the
//!   settings file, as the user owns it) and mail uses an IMAP App Password
//!   stored encrypted with DPAPI in `secrets.bin`.
//! * Nothing is written to `settings.json` from here; the frontend owns the
//!   toggles. Pollers read settings from the cached map (`get_setting_str`).
//! * Pollers only emit when the payload actually changed, so listeners get
//!   idempotent updates. The test commands also emit on success, which makes
//!   the panel update instantly without waiting for the next poll.

use std::io::Read;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use chrono::{Duration as ChronoDuration, NaiveDate, NaiveDateTime, TimeZone, Utc};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::utils::get_setting_str;

const SETTING_CAL_ENABLED: &str = "nook-calendar-sync-enabled";
const SETTING_CAL_URL: &str = "nook-calendar-ical-url";
const SETTING_CAL_INTERVAL: &str = "nook-calendar-interval";
const SETTING_MAIL_ENABLED: &str = "nook-mail-enabled";
const SETTING_MAIL_ADDRESS: &str = "nook-mail-address";
const SETTING_MAIL_HOST: &str = "nook-mail-imap-host";
const SETTING_MAIL_INTERVAL: &str = "nook-mail-interval";

const DEFAULT_IMAP_HOST: &str = "imap.gmail.com";
const DEFAULT_INTERVAL_MIN: u64 = 30;
/// Mail is polled more often than the calendar because the whole point of the
/// feature is a near-real-time "new mail" pulse.
const DEFAULT_MAIL_INTERVAL_MIN: u64 = 5;
/// While a feature is disabled the loop still wakes every few seconds so a
/// freshly enabled feature starts polling almost instantly.
const DISABLED_RETRY_SECS: u64 = 5;

const ICAL_MAX_BYTES: usize = 4 * 1024 * 1024;
const ICAL_TIMEOUT_SECS: u64 = 15;
/// Events within `[yesterday, now + LOOKAHEAD]` are kept. The frontend shows
/// the current month, so ~3 months of lookahead covers navigation.
const CAL_LOOKAHEAD_DAYS: i64 = 90;
/// Safety cap for infinite/very long recurrence rules.
const RECUR_LIMIT: u16 = 5000;
/// Upper bound on emitted event items so a pathological calendar cannot produce
/// an unbounded payload.
const MAX_CALENDAR_ITEMS: usize = 1000;

const SECRETS_FILE: &str = "secrets.bin";
const MAIL_STATE_FILE: &str = "mail-state.json";

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct CalendarEventItem {
    /// `YYYY-MM-DD`
    pub date: String,
    pub title: String,
    /// Local wall-clock start time as `HH:MM`. `None` for all-day events and for
    /// the trailing days of a multi-day event.
    pub start: Option<String>,
    /// True for `VALUE=DATE` events (no time).
    pub all_day: bool,
}

#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct MailMessage {
    pub uid: u32,
    pub subject: String,
    pub from: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct MailSummary {
    pub unread: u32,
    pub subject: String,
    pub from: String,
    pub has_more: bool,
    pub updated_at: u64,
    pub messages: Vec<MailMessage>,
}

static LAST_CALENDAR: Mutex<Option<Vec<CalendarEventItem>>> = Mutex::new(None);
static LAST_MAIL: Mutex<Option<MailSummary>> = Mutex::new(None);

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

fn setting_enabled(app: &AppHandle, key: &str) -> bool {
    get_setting_str(app, key).as_deref() == Some("true")
}

fn setting_minutes(app: &AppHandle, key: &str, default: u64) -> u64 {
    get_setting_str(app, key)
        .and_then(|v| v.trim().parse::<u64>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(default)
}

fn interval_secs(minutes: u64) -> Duration {
    Duration::from_secs(minutes.saturating_mul(60).max(DISABLED_RETRY_SECS))
}

fn mail_host(app: &AppHandle) -> String {
    get_setting_str(app, SETTING_MAIL_HOST)
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| DEFAULT_IMAP_HOST.to_string())
}

// ---------------------------------------------------------------------------
// DPAPI secrets (helper typed mainly against the `windows` crate)
// ---------------------------------------------------------------------------

fn secrets_path(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join(SECRETS_FILE))
}

fn mail_state_path(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .app_config_dir()
        .ok()
        .map(|dir| dir.join(MAIL_STATE_FILE))
}

/// Encrypts `plain` with DPAPI under the current user. Only the same user on
/// the same machine can decrypt it, which matches the threat model of an IMAP
/// App Password sitting next to cached settings.
#[cfg(windows)]
fn dpapi_encrypt(plain: &[u8]) -> Result<Vec<u8>, String> {
    use windows::Win32::Foundation::{LocalFree, HLOCAL};
    use windows::Win32::Security::Cryptography::{
        CryptProtectData, CRYPTPROTECT_PROMPTSTRUCT, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
    };

    let input = CRYPT_INTEGER_BLOB {
        cbData: plain.len() as u32,
        pbData: plain.as_ptr() as *mut u8,
    };
    let mut output = CRYPT_INTEGER_BLOB::default();
    unsafe {
        CryptProtectData(
            &input,
            windows::core::PCWSTR::null(),
            None,
            None,
            None::<*const CRYPTPROTECT_PROMPTSTRUCT>,
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output,
        )
        .map_err(|e| format!("DPAPI protect failed: {e}"))?;

        let result = std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec();
        let _ = LocalFree(Some(HLOCAL(output.pbData as *mut _)));
        Ok(result)
    }
}

#[cfg(not(windows))]
fn dpapi_encrypt(plain: &[u8]) -> Result<Vec<u8>, String> {
    // No-op fallback so the crate still builds on non-Windows for tests.
    Ok(plain.to_vec())
}

#[cfg(windows)]
fn dpapi_decrypt(blob: &[u8]) -> Result<Vec<u8>, String> {
    use windows::Win32::Foundation::{LocalFree, HLOCAL};
    use windows::Win32::Security::Cryptography::{
        CryptUnprotectData, CRYPTPROTECT_PROMPTSTRUCT, CRYPTPROTECT_UI_FORBIDDEN,
        CRYPT_INTEGER_BLOB,
    };

    let input = CRYPT_INTEGER_BLOB {
        cbData: blob.len() as u32,
        pbData: blob.as_ptr() as *mut u8,
    };
    let mut output = CRYPT_INTEGER_BLOB::default();
    unsafe {
        CryptUnprotectData(
            &input,
            None,
            None,
            None,
            None::<*const CRYPTPROTECT_PROMPTSTRUCT>,
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output,
        )
        .map_err(|e| format!("DPAPI unprotect failed: {e}"))?;

        let result = std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec();
        let _ = LocalFree(Some(HLOCAL(output.pbData as *mut _)));
        Ok(result)
    }
}

#[cfg(not(windows))]
fn dpapi_decrypt(blob: &[u8]) -> Result<Vec<u8>, String> {
    Ok(blob.to_vec())
}

fn read_secret(app: &AppHandle) -> Option<String> {
    let path = secrets_path(app)?;
    let blob = std::fs::read(path).ok()?;
    dpapi_decrypt(&blob)
        .ok()
        .map(|bytes| String::from_utf8_lossy(&bytes).into_owned())
}

fn write_secret(app: &AppHandle, value: &str) -> Result<(), String> {
    let path = secrets_path(app).ok_or_else(|| "No config directory".to_string())?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let blob = dpapi_encrypt(value.as_bytes())?;
    std::fs::write(path, blob).map_err(|e| e.to_string())
}

fn read_mail_state(app: &AppHandle) -> Option<u64> {
    mail_state_path(app)
        .and_then(|path| std::fs::read_to_string(path).ok())
        .and_then(|content| content.trim().parse().ok())
}

fn write_mail_state(app: &AppHandle, uid_next: u64) {
    if let Some(path) = mail_state_path(app) {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(path, uid_next.to_string());
    }
}

// ---------------------------------------------------------------------------
// iCal parsing / recurrence
// ---------------------------------------------------------------------------

/// A parsed iCal timestamp normalized to UTC. `is_date` marks `VALUE=DATE`
/// (all-day) values, which carry no time.
struct RawDt {
    naive: NaiveDateTime,
    is_date: bool,
}

fn parse_ical_dt(value: &str) -> Option<RawDt> {
    let value = value.trim();
    let day = NaiveDate::parse_from_str(&value[..8.min(value.len())], "%Y%m%d").ok()?;
    if value.len() >= 15 && value.as_bytes()[8] == b'T' {
        let time = &value[9..];
        let time = time.strip_suffix('Z').unwrap_or(time);
        let (hh, mm, ss) = match (time.len() >= 2, time.len() >= 4, time.len() >= 6) {
            (true, true, true) => (
                time[..2].parse::<u32>().ok()?,
                time[2..4].parse::<u32>().ok()?,
                time[4..6].parse::<u32>().ok()?,
            ),
            (true, true, false) => (
                time[..2].parse::<u32>().ok()?,
                time[2..4].parse::<u32>().ok()?,
                0,
            ),
            _ => return None,
        };
        let naive = day.and_hms_opt(hh.min(23), mm.min(59), ss.min(59))?;
        Some(RawDt {
            naive,
            is_date: false,
        })
    } else if value.len() == 8 {
        Some(RawDt {
            naive: day.and_hms_opt(0, 0, 0).unwrap(),
            is_date: true,
        })
    } else {
        None
    }
}

fn parse_duration(value: &str) -> Option<ChronoDuration> {
    let value = value.strip_prefix('P')?;
    let (date_part, time_part) = match value.find('T') {
        Some(idx) => (&value[..idx], &value[idx + 1..]),
        None => (value, ""),
    };
    let mut total = 0i64;
    let mut number = String::new();
    for part in [date_part, time_part] {
        for ch in part.chars() {
            if ch.is_ascii_digit() {
                number.push(ch);
            } else {
                let n: i64 = if number.is_empty() {
                    if ch == 'T' || part == date_part {
                        continue;
                    }
                    return None;
                } else {
                    number.parse().ok()?
                };
                match ch {
                    'W' => total += n * 7 * 24 * 3600,
                    'D' => total += n * 24 * 3600,
                    'H' => total += n * 3600,
                    'M' => total += n * 60,
                    'S' => total += n,
                    'T' => continue,
                    _ => return None,
                }
                number.clear();
            }
        }
        if !number.is_empty() {
            return None;
        }
    }
    if total <= 0 {
        return None;
    }
    Some(ChronoDuration::seconds(total))
}

fn utc_str(naive: &NaiveDateTime) -> String {
    naive.format("%Y%m%dT%H%M%S").to_string()
}

/// Every date from `start.date()` through `end.date()`, clipped to the poll
/// window. Used both for multi-day events and (per occurrence) for recurrence.
fn occurrence_dates(
    start: NaiveDateTime,
    end: NaiveDateTime,
    window: (NaiveDate, NaiveDate),
) -> Vec<NaiveDate> {
    let mut out = Vec::new();
    if end < start {
        return out;
    }
    let mut day = start.date();
    while day <= end.date() && day <= window.1 {
        if day >= window.0 {
            out.push(day);
        }
        match day.succ_opt() {
            Some(next) => day = next,
            None => break,
        }
    }
    out
}

/// The `Component::get_property` trait and its `Property` type are private in
/// `ical`, so look the property up through the public `properties` field and
/// return its value directly.
fn prop_value<'a>(
    event: &'a ical::parser::ical::component::IcalEvent,
    name: &str,
) -> Option<&'a str> {
    event
        .properties
        .iter()
        .find(|p| p.name == name)
        .and_then(|p| p.value.as_deref())
}

/// Expands one VEVENT into `CalendarEventItem`s: every day the event occupies
/// gets its own item (so a multi-day event dots each day). The first day keeps
/// the wall-clock `HH:MM` start; trailing days are flagged `all_day`. CANCELLED
/// events are skipped. Single occurrences are emitted directly; events with an
/// RRULE are expanded over the poll window with RDATEs merged in and EXDATEs
/// removed.
fn expand_event(
    event: &ical::parser::ical::component::IcalEvent,
    window: (NaiveDate, NaiveDate),
    out: &mut Vec<CalendarEventItem>,
) {
    if prop_value(event, "STATUS").is_some_and(|v| v.eq_ignore_ascii_case("CANCELLED")) {
        return;
    }

    let title = prop_value(event, "SUMMARY")
        .map(|v| v.to_string())
        .unwrap_or_else(|| "Event".to_string());

    let dtstart = match prop_value(event, "DTSTART").and_then(parse_ical_dt) {
        Some(dt) => dt,
        None => return,
    };

    let dtend_for_lighting = prop_value(event, "DTEND")
        .and_then(parse_ical_dt)
        .map(|dt| dt.naive)
        .or_else(|| {
            prop_value(event, "DURATION")
                .and_then(parse_duration)
                .map(|dur| dtstart.naive + dur)
        })
        .unwrap_or_else(|| {
            if dtstart.is_date {
                dtstart.naive + ChronoDuration::days(1)
            } else {
                dtstart.naive + ChronoDuration::hours(1)
            }
        });

    // For all-day events the end is exclusive (midnight), so the last date it
    // lights is `dtend - 1 day`; a plain 9:00→10:00 event lights exactly one
    // day. This duration is reused for every recurrence occurrence.
    let lighting_dur = if dtstart.is_date {
        dtend_for_lighting - dtstart.naive - ChronoDuration::days(1)
    } else {
        dtend_for_lighting - dtstart.naive
    };

    let all_day = dtstart.is_date;
    let mut push_occurrence = |occ_start: NaiveDateTime| {
        let start_date = occ_start.date();
        for date in occurrence_dates(occ_start, occ_start + lighting_dur, window) {
            let start = if !all_day && date == start_date {
                Some(occ_start.format("%H:%M").to_string())
            } else {
                None
            };
            out.push(CalendarEventItem {
                date: date.format("%Y-%m-%d").to_string(),
                title: title.clone(),
                start,
                all_day,
            });
        }
    };

    let rrules: Vec<String> = event
        .properties
        .iter()
        .filter(|p| p.name == "RRULE")
        .filter_map(|p| p.value.clone())
        .collect();

    if rrules.is_empty() {
        push_occurrence(dtstart.naive);
        return;
    }

    let values_for = |name: &str| -> Vec<String> {
        event
            .properties
            .iter()
            .filter(|p| p.name == name)
            .filter_map(|p| p.value.clone())
            .flat_map(|v| {
                v.split(',')
                    .filter_map(|part| {
                        parse_ical_dt(part).map(|dt| format!("{}Z", utc_str(&dt.naive)))
                    })
                    .collect::<Vec<_>>()
            })
            .collect()
    };

    let rdates = values_for("RDATE");
    let exdates = values_for("EXDATE");

    for rrule in &rrules {
        let mut text = format!("DTSTART:{}Z\nRRULE:{}", utc_str(&dtstart.naive), rrule);
        if !rdates.is_empty() {
            text.push_str(&format!("\nRDATE;VALUE=DATE-TIME:{}", rdates.join(",")));
        }
        if !exdates.is_empty() {
            text.push_str(&format!("\nEXDATE;VALUE=DATE-TIME:{}", exdates.join(",")));
        }

        let Ok(set) = text.parse::<rrule::RRuleSet>() else {
            // Unparseable rule — keep at least the single occurrence.
            push_occurrence(dtstart.naive);
            continue;
        };

        let range_start = rrule::Tz::UTC.from_utc_datetime(&window.0.and_hms_opt(0, 0, 0).unwrap());
        let range_end = rrule::Tz::UTC.from_utc_datetime(&window.1.and_hms_opt(0, 0, 0).unwrap())
            + ChronoDuration::days(1);

        let result = set.after(range_start).before(range_end).all(RECUR_LIMIT);
        for occurrence in result.dates {
            push_occurrence(occurrence.naive_utc());
        }
    }
}

fn calendar_window(now_utc: NaiveDateTime) -> (NaiveDate, NaiveDate) {
    let start = (now_utc - ChronoDuration::days(1)).date();
    let end = (now_utc + ChronoDuration::days(CAL_LOOKAHEAD_DAYS)).date();
    (start, end)
}

/// Fetches and parses the calendar. Returns one item per event-day in the
/// current poll window, sorted by date then start time.
fn fetch_calendar_payload(url: &str) -> Result<Vec<CalendarEventItem>, String> {
    if !url.starts_with("https://") {
        return Err(
            "Calendar URL must be https (private Google Calendar links are https).".to_string(),
        );
    }

    let resp = ureq::get(url)
        .timeout(Duration::from_secs(ICAL_TIMEOUT_SECS))
        .call()
        .map_err(|e| match e {
            ureq::Error::Status(code, _) => format!("HTTP {code}"),
            other => other.to_string(),
        })?;

    let reader = resp.into_reader();
    let mut buf = Vec::new();
    reader
        .take((ICAL_MAX_BYTES + 1) as u64)
        .read_to_end(&mut buf)
        .map_err(|e| e.to_string())?;
    if buf.len() > ICAL_MAX_BYTES {
        return Err("Calendar file is too large".to_string());
    }

    let window = calendar_window(Utc::now().naive_utc());
    let mut items: Vec<CalendarEventItem> = Vec::new();
    let parser = ical::IcalParser::new(std::io::BufReader::new(buf.as_slice()));
    let mut any_calendar = false;
    for calendar in parser.flatten() {
        any_calendar = true;
        for event in &calendar.events {
            expand_event(event, window, &mut items);
        }
    }
    if !any_calendar {
        return Err("No VCALENDAR found in the response — check the URL.".to_string());
    }

    items.sort_by(|a, b| {
        a.date
            .cmp(&b.date)
            .then_with(|| a.start.cmp(&b.start))
            .then_with(|| a.title.cmp(&b.title))
    });
    items.truncate(MAX_CALENDAR_ITEMS);
    Ok(items)
}

// ---------------------------------------------------------------------------
// Mail / IMAP
// ---------------------------------------------------------------------------

/// Connects, reads unread count / next UID and grabs the envelope of the
/// newest unseen message. Returns `(summary, uid_next)`.
fn decode_mail_header(value: &[u8]) -> String {
    let mut header = b"Subject: ".to_vec();
    header.extend_from_slice(value);
    mailparse::parse_header(&header)
        .map(|(header, _)| header.get_value())
        .unwrap_or_else(|_| String::from_utf8_lossy(value).into_owned())
}

fn connect_and_build(
    address: &str,
    host: &str,
    password: &str,
) -> Result<(MailSummary, u64), String> {
    let tls = native_tls::TlsConnector::builder()
        .build()
        .map_err(|e| e.to_string())?;

    let client = imap::connect((host, 993), host, &tls)
        .map_err(|e| format!("IMAP connect to {host} failed: {e}"))?;
    let mut client = client
        .login(address, password)
        .map_err(|(e, _)| format!("IMAP login failed: {e}"))?;

    // SELECT, not STATUS: the `imap` crate only fills `uid_next`/`unseen` on the
    // returned Mailbox for SELECT/EXAMINE responses. A STATUS reply is routed to
    // the unsolicited channel instead, leaving the Mailbox empty — which meant
    // `uid_next` always read back as 0 and the arrival detection never fired.
    let mailbox = client
        .select("INBOX")
        .map_err(|e| format!("IMAP select failed: {e}"))?;
    let uid_next = mailbox.uid_next.unwrap_or(0) as u64;

    // SELECT's `[UNSEEN n]` is the *sequence number* of the first unseen message,
    // not a count, so count the unseen UIDs directly for an accurate badge.
    let unseen = client
        .uid_search("UNSEEN")
        .map_err(|e| format!("IMAP search failed: {e}"))?;
    let unread = unseen.len() as u32;
    let has_more = unread > 1;

    let mut subject = String::new();
    let mut from = String::new();
    let mut messages = Vec::new();
    let mut newest: Vec<u32> = unseen.iter().copied().collect();
    newest.sort_unstable_by(|a, b| b.cmp(a));
    newest.truncate(5);

    for max_uid in newest {
        subject.clear();
        from.clear();
        let fetches = client
            .uid_fetch(max_uid.to_string(), "(ENVELOPE)")
            .map_err(|e| format!("IMAP fetch failed: {e}"))?;
        for fetch in fetches.iter() {
            if let Some(envelope) = fetch.envelope() {
                if subject.is_empty() {
                    subject = envelope
                        .subject
                        .as_ref()
                        .map(|s| decode_mail_header(s))
                        .unwrap_or_default();
                }
                if from.is_empty() {
                    if let Some(addr) = envelope.from.as_ref().and_then(|f| f.first()) {
                        from = addr
                            .name
                            .as_ref()
                            .map(|n| decode_mail_header(n))
                            .filter(|n| !n.is_empty())
                            .unwrap_or_else(|| {
                                addr.mailbox
                                    .as_ref()
                                    .map(|m| String::from_utf8_lossy(m).into_owned())
                                    .unwrap_or_default()
                            });
                    }
                }
            }
        }
        messages.push(MailMessage {
            uid: max_uid,
            subject: subject.clone(),
            from: from.clone(),
        });
    }

    if let Some(first) = messages.first() {
        subject = first.subject.clone();
        from = first.from.clone();
    }

    let _ = client.logout();

    Ok((
        MailSummary {
            unread,
            subject,
            from,
            has_more,
            updated_at: now_secs(),
            messages,
        },
        uid_next,
    ))
}

// ---------------------------------------------------------------------------
// Emission (change-detected, so listeners see idempotent updates)
// ---------------------------------------------------------------------------

fn emit_calendar(app: &AppHandle, events: Vec<CalendarEventItem>) {
    let mut last = LAST_CALENDAR.lock().unwrap();
    if last.as_ref() == Some(&events) {
        return;
    }
    *last = Some(events.clone());
    drop(last);
    let _ = app.emit(
        "calendar-events-updated",
        CalendarEventItemPayload {
            events,
            updated_at: now_secs(),
        },
    );
}

#[derive(Clone, Serialize)]
struct CalendarEventItemPayload {
    events: Vec<CalendarEventItem>,
    updated_at: u64,
}

fn emit_mail(app: &AppHandle, summary: MailSummary, arrived: bool) {
    let mut last = LAST_MAIL.lock().unwrap();
    let changed = match last.as_ref() {
        Some(prev) => {
            prev.unread != summary.unread
                || prev.subject != summary.subject
                || prev.from != summary.from
                || prev.has_more != summary.has_more
                || prev.messages != summary.messages
        }
        None => true,
    };
    if changed {
        *last = Some(summary.clone());
        drop(last);
        let _ = app.emit("mail-updated", &summary);
    }
    if arrived {
        // Even if the summary text is unchanged (e.g. a second mail from the
        // same sender), the peek should re-fire.
        let _ = app.emit("mail-arrived", &summary);
    }
}

// ---------------------------------------------------------------------------
// Poll loops
// ---------------------------------------------------------------------------

fn poll_calendar_once(app: &AppHandle) -> Result<(), String> {
    let url = get_setting_str(app, SETTING_CAL_URL)
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty());
    let Some(url) = url else {
        return Ok(());
    };
    let events = fetch_calendar_payload(&url)?;
    emit_calendar(app, events);
    Ok(())
}

fn poll_mail_once(app: &AppHandle) -> Result<(), String> {
    let address = get_setting_str(app, SETTING_MAIL_ADDRESS)
        .map(|v| v.trim().to_string())
        .unwrap_or_default();
    if address.is_empty() {
        return Ok(());
    }
    let Some(password) = read_secret(app) else {
        return Ok(());
    };
    let host = mail_host(app);

    let (summary, uid_next) = connect_and_build(&address, &host, &password)?;

    let prev = LAST_MAIL.lock().unwrap().clone();
    let state_last = read_mail_state(app);
    let arrived =
        prev.is_some() && state_last.is_some_and(|last| uid_next > last) && summary.unread > 0;

    write_mail_state(app, uid_next);
    emit_mail(app, summary, arrived);
    Ok(())
}

pub fn spawn_calendar_poller(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let enabled = setting_enabled(&app, SETTING_CAL_ENABLED);
            if enabled {
                if let Err(e) = poll_calendar_once(&app) {
                    eprintln!("[nook] calendar poll failed: {e}");
                }
            }
            let delay = if enabled {
                interval_secs(setting_minutes(
                    &app,
                    SETTING_CAL_INTERVAL,
                    DEFAULT_INTERVAL_MIN,
                ))
            } else {
                Duration::from_secs(DISABLED_RETRY_SECS)
            };
            tokio::time::sleep(delay).await;
        }
    });
}

pub fn spawn_mail_poller(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let enabled = setting_enabled(&app, SETTING_MAIL_ENABLED);
            if enabled {
                if let Err(e) = poll_mail_once(&app) {
                    eprintln!("[nook] mail poll failed: {e}");
                }
            }
            let delay = if enabled {
                interval_secs(setting_minutes(
                    &app,
                    SETTING_MAIL_INTERVAL,
                    DEFAULT_MAIL_INTERVAL_MIN,
                ))
            } else {
                Duration::from_secs(DISABLED_RETRY_SECS)
            };
            tokio::time::sleep(delay).await;
        }
    });
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn test_ical_url(app: AppHandle, url: String) -> Result<u32, String> {
    let url = url.trim().to_string();
    let events = tauri::async_runtime::spawn_blocking(move || fetch_calendar_payload(&url))
        .await
        .map_err(|e| e.to_string())??;
    let count = events.len() as u32;
    emit_calendar(&app, events);
    Ok(count)
}

#[tauri::command]
pub async fn test_imap_connection(
    app: AppHandle,
    address: String,
    host: String,
    password: String,
) -> Result<u32, String> {
    let address = address.trim().to_string();
    let host = host.trim().to_string();
    if address.is_empty() {
        return Err("Email address is required".to_string());
    }
    let (summary, _uid_next) =
        tauri::async_runtime::spawn_blocking(move || connect_and_build(&address, &host, &password))
            .await
            .map_err(|e| e.to_string())??;
    let unread = summary.unread;
    emit_mail(&app, summary, false);
    Ok(unread)
}

#[tauri::command]
pub fn save_mail_password(app: AppHandle, password: String) -> Result<(), String> {
    if password.is_empty() {
        return Err("Password cannot be empty".to_string());
    }
    write_secret(&app, &password)
}

#[tauri::command]
pub fn clear_mail_password(app: AppHandle) -> Result<(), String> {
    if let Some(path) = secrets_path(&app) {
        if path.exists() {
            std::fs::remove_file(path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn has_mail_password(app: AppHandle) -> bool {
    read_secret(&app).is_some()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_mime_mail_headers() {
        assert_eq!(
            decode_mail_header(b"=?UTF-8?Q?Oferta_de_trabajo?="),
            "Oferta de trabajo"
        );
        assert_eq!(decode_mail_header(b"=?UTF-8?B?SG9sYQ==?="), "Hola");
        assert_eq!(decode_mail_header(b"Plain subject"), "Plain subject");
        assert_eq!(decode_mail_header(b"=?UTF-8?Q?Reuni=C3=B3n?="), "Reunión");
    }
    use chrono::Timelike;

    fn calendar_with(body: &str) -> ical::parser::ical::component::IcalCalendar {
        let full = format!(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//nook.test//EN\r\n{body}END:VCALENDAR\r\n"
        );
        ical::IcalParser::new(std::io::BufReader::new(full.as_bytes()))
            .flatten()
            .next()
            .unwrap()
    }

    fn window() -> (NaiveDate, NaiveDate) {
        (
            NaiveDate::from_ymd_opt(2026, 10, 1).unwrap(),
            NaiveDate::from_ymd_opt(2026, 12, 31).unwrap(),
        )
    }

    fn events(body: &str) -> Vec<CalendarEventItem> {
        let calendar = calendar_with(body);
        let mut out = Vec::new();
        expand_event(&calendar.events[0], window(), &mut out);
        out
    }

    fn on<'a>(items: &'a [CalendarEventItem], date: NaiveDate) -> Vec<&'a CalendarEventItem> {
        let key = date.format("%Y-%m-%d").to_string();
        items.iter().filter(|e| e.date == key).collect()
    }

    fn has(items: &[CalendarEventItem], date: NaiveDate) -> bool {
        !on(items, date).is_empty()
    }

    #[test]
    fn parses_ical_datetimes() {
        let timed = parse_ical_dt("20261005T090000Z").unwrap();
        assert!(!timed.is_date);
        assert_eq!(
            timed.naive,
            NaiveDate::from_ymd_opt(2026, 10, 5)
                .unwrap()
                .and_hms_opt(9, 0, 0)
                .unwrap()
        );

        let local = parse_ical_dt("20261005T093000").unwrap();
        assert_eq!(local.naive.minute(), 30);

        let all_day = parse_ical_dt("20261010").unwrap();
        assert!(all_day.is_date);
        assert_eq!(all_day.naive.hour(), 0);
    }

    #[test]
    fn parses_durations() {
        assert_eq!(parse_duration("PT1H").unwrap(), ChronoDuration::hours(1));
        assert_eq!(parse_duration("P1D").unwrap(), ChronoDuration::days(1));
        assert_eq!(
            parse_duration("P1DT2H30M").unwrap(),
            ChronoDuration::hours(26) + ChronoDuration::minutes(30)
        );
        assert!(parse_duration("garbage").is_none());
    }

    #[test]
    fn single_timed_event_lights_one_day() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART:20261005T090000Z\r\nDTEND:20261005T100000Z\r\nSUMMARY:Standup\r\nEND:VEVENT\r\n",
        );
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].title, "Standup");
        assert_eq!(items[0].start.as_deref(), Some("09:00"));
        assert!(!items[0].all_day);
    }

    #[test]
    fn all_day_multi_day_span() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261010\r\nDTEND;VALUE=DATE:20261013\r\nSUMMARY:Vacation\r\nEND:VEVENT\r\n",
        );
        assert_eq!(items.len(), 3);
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 10).unwrap()));
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 12).unwrap()));
        assert!(!has(&items, NaiveDate::from_ymd_opt(2026, 10, 13).unwrap()));
        assert!(items.iter().all(|e| e.all_day && e.start.is_none()));
    }

    #[test]
    fn weekly_recurrence_expands() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART:20261005T090000Z\r\nDTEND:20261005T100000Z\r\nRRULE:FREQ=WEEKLY;COUNT=5\r\nSUMMARY:Standup\r\nEND:VEVENT\r\n",
        );
        assert_eq!(items.len(), 5);
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 5).unwrap()));
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 11, 2).unwrap()));
        assert!(items.iter().all(|e| e.start.as_deref() == Some("09:00")));
    }

    #[test]
    fn exdate_removes_an_occurrence() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART:20261005T090000Z\r\nDTEND:20261005T100000Z\r\nRRULE:FREQ=WEEKLY;COUNT=4\r\nEXDATE:20261012T090000Z\r\nSUMMARY:Standup\r\nEND:VEVENT\r\n",
        );
        assert!(!has(&items, NaiveDate::from_ymd_opt(2026, 10, 12).unwrap()));
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 19).unwrap()));
    }

    #[test]
    fn cancelled_events_are_skipped() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART:20261005T090000Z\r\nSTATUS:CANCELLED\r\nSUMMARY:Gone\r\nEND:VEVENT\r\n",
        );
        assert!(items.is_empty());
    }

    #[test]
    fn multiple_events_same_day_stay_separate() {
        let full = format!(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//nook.test//EN\r\n\
             BEGIN:VEVENT\r\nDTSTART:20261005T090000Z\r\nDTEND:20261005T100000Z\r\nSUMMARY:One\r\nEND:VEVENT\r\n\
             BEGIN:VEVENT\r\nDTSTART:20261005T140000Z\r\nDTEND:20261005T150000Z\r\nSUMMARY:Two\r\nEND:VEVENT\r\n\
             END:VCALENDAR\r\n"
        );
        let calendar = ical::IcalParser::new(std::io::BufReader::new(full.as_bytes()))
            .flatten()
            .next()
            .unwrap();
        let mut items = Vec::new();
        for event in &calendar.events {
            expand_event(event, window(), &mut items);
        }
        let day = NaiveDate::from_ymd_opt(2026, 10, 5).unwrap();
        let day_items = on(&items, day);
        assert_eq!(day_items.len(), 2);
        assert_eq!(day_items[0].title, "One");
        assert_eq!(day_items[0].start.as_deref(), Some("09:00"));
        assert_eq!(day_items[1].title, "Two");
        assert_eq!(day_items[1].start.as_deref(), Some("14:00"));
    }

    #[test]
    fn parses_duration_weeks_and_time_only() {
        assert_eq!(parse_duration("P2W").unwrap(), ChronoDuration::days(14));
        assert_eq!(
            parse_duration("PT30M").unwrap(),
            ChronoDuration::minutes(30)
        );
        assert_eq!(
            parse_duration("PT45S").unwrap(),
            ChronoDuration::seconds(45)
        );
        assert_eq!(parse_duration("P0D"), None);
        assert_eq!(parse_duration("P"), None);
        assert_eq!(parse_duration("PT"), None);
    }

    #[test]
    fn occurrence_dates_clip_to_window() {
        let start = NaiveDate::from_ymd_opt(2026, 9, 29)
            .unwrap()
            .and_hms_opt(9, 0, 0)
            .unwrap();
        let end = NaiveDate::from_ymd_opt(2026, 10, 3)
            .unwrap()
            .and_hms_opt(9, 0, 0)
            .unwrap();
        let win = (
            NaiveDate::from_ymd_opt(2026, 10, 1).unwrap(),
            NaiveDate::from_ymd_opt(2026, 10, 2).unwrap(),
        );
        assert_eq!(
            occurrence_dates(start, end, win),
            vec![
                NaiveDate::from_ymd_opt(2026, 10, 1).unwrap(),
                NaiveDate::from_ymd_opt(2026, 10, 2).unwrap(),
            ]
        );
    }

    #[test]
    fn occurrence_dates_empty_when_end_before_start() {
        let start = NaiveDate::from_ymd_opt(2026, 10, 5)
            .unwrap()
            .and_hms_opt(9, 0, 0)
            .unwrap();
        let end = NaiveDate::from_ymd_opt(2026, 10, 4)
            .unwrap()
            .and_hms_opt(9, 0, 0)
            .unwrap();
        assert!(occurrence_dates(start, end, window()).is_empty());
    }

    #[test]
    fn calendar_window_spans_yesterday_to_lookahead() {
        let now = NaiveDate::from_ymd_opt(2026, 10, 5)
            .unwrap()
            .and_hms_opt(12, 0, 0)
            .unwrap();
        let (start, end) = calendar_window(now);
        assert_eq!(start, NaiveDate::from_ymd_opt(2026, 10, 4).unwrap());
        assert_eq!(
            end,
            NaiveDate::from_ymd_opt(2026, 10, 5).unwrap()
                + ChronoDuration::days(CAL_LOOKAHEAD_DAYS)
        );
    }

    #[test]
    fn duration_based_end_lights_multiple_days() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART:20261005T090000Z\r\nDURATION:P3D\r\nSUMMARY:Sprint\r\nEND:VEVENT\r\n",
        );
        assert_eq!(items.len(), 4);
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 8).unwrap()));
        assert_eq!(
            on(&items, NaiveDate::from_ymd_opt(2026, 10, 5).unwrap())[0]
                .start
                .as_deref(),
            Some("09:00")
        );
    }

    #[test]
    fn timed_event_spilling_past_midnight_marks_both_days() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART:20261005T220000Z\r\nDURATION:PT4H\r\nSUMMARY:Deploy\r\nEND:VEVENT\r\n",
        );
        assert_eq!(items.len(), 2);
        let first = on(&items, NaiveDate::from_ymd_opt(2026, 10, 5).unwrap());
        assert_eq!(first[0].start.as_deref(), Some("22:00"));
        let second = on(&items, NaiveDate::from_ymd_opt(2026, 10, 6).unwrap());
        assert_eq!(second.len(), 1);
        assert!(second[0].start.is_none());
        assert!(!second[0].all_day);
    }

    #[test]
    fn rdate_adds_an_occurrence() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART:20261005T090000Z\r\nDTEND:20261005T100000Z\r\nRRULE:FREQ=WEEKLY;COUNT=2\r\nRDATE:20261020T090000Z\r\nSUMMARY:Standup\r\nEND:VEVENT\r\n",
        );
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 5).unwrap()));
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 12).unwrap()));
        assert!(has(&items, NaiveDate::from_ymd_opt(2026, 10, 20).unwrap()));
    }

    #[test]
    fn all_day_single_day_lights_one_day() {
        let items = events(
            "BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261010\r\nDTEND;VALUE=DATE:20261011\r\nSUMMARY:Holiday\r\nEND:VEVENT\r\n",
        );
        assert_eq!(items.len(), 1);
        assert!(items[0].all_day);
        assert_eq!(items[0].date, "2026-10-10");
    }
}
