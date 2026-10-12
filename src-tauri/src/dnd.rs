//! Windows Do Not Disturb / Focus Assist control via the (undocumented)
//! `QuietHoursSettings` COM object. The same approach is used by YASB.
//!
//! CLSID/IID and profile identifiers come from the QuietHours type library:
//! - coclass  QuietHoursSettings : {F53321FA-34F8-4B7F-B9A3-361877CB94CF}
//! - interface IQuietHoursSettings : {6BFF4732-81EC-4FFB-AE67-B6C1BC29631F}
//!
//! After IUnknown (QueryInterface=0, AddRef=1, Release=2) the vtable is:
//! idx 3 = get_UserSelectedProfile, idx 4 = put_UserSelectedProfile. We only
//! declare those first two methods, so their slots line up with the real vtable.

use windows::core::{IUnknown, IUnknown_Vtbl, GUID, HRESULT, PWSTR};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoTaskMemFree, CoUninitialize, CLSCTX_LOCAL_SERVER,
    COINIT_APARTMENTTHREADED,
};

const CLSID_QUIET_HOURS_SETTINGS: GUID = GUID::from_u128(0xF53321FA_34F8_4B7F_B9A3_361877CB94CF);

const PROFILE_UNRESTRICTED: &str = "Microsoft.QuietHoursProfile.Unrestricted";
const PROFILE_PRIORITY: &str = "Microsoft.QuietHoursProfile.PriorityOnly";
const PROFILE_ALARMS: &str = "Microsoft.QuietHoursProfile.AlarmsOnly";

#[windows::core::interface("6bff4732-81ec-4ffb-ae67-b6c1bc29631f")]
unsafe trait IQuietHoursSettings: IUnknown {
    fn read_user_selected_profile(&self, profile: *mut PWSTR) -> HRESULT;
    fn write_user_selected_profile(&self, profile: *const u16) -> HRESULT;
}

fn mode_to_profile(mode: &str) -> Option<&'static str> {
    match mode {
        "off" | "disabled" => Some(PROFILE_UNRESTRICTED),
        "priority" | "on" => Some(PROFILE_PRIORITY),
        "alarms" => Some(PROFILE_ALARMS),
        _ => None,
    }
}

fn profile_to_mode(profile: &str) -> String {
    match profile {
        PROFILE_UNRESTRICTED => "off".to_string(),
        PROFILE_PRIORITY => "priority".to_string(),
        PROFILE_ALARMS => "alarms".to_string(),
        _ => "unknown".to_string(),
    }
}

/// Runs a closure against a freshly created `QuietHoursSettings` instance,
/// taking care of COM init/uninit on the calling thread.
unsafe fn with_settings<T>(
    f: impl FnOnce(&IQuietHoursSettings) -> windows::core::Result<T>,
) -> windows::core::Result<T> {
    let hr = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
    // S_OK / S_FALSE mean we own the init and must balance it. RPC_E_CHANGED_MODE
    // (a different apartment model was already set) still lets us use COM.
    let should_uninit = hr.is_ok();

    let result = (|| {
        let settings: IQuietHoursSettings = unsafe {
            CoCreateInstance(
                &CLSID_QUIET_HOURS_SETTINGS,
                None::<&IUnknown>,
                CLSCTX_LOCAL_SERVER,
            )
        }?;
        f(&settings)
    })();

    if should_uninit {
        unsafe { CoUninitialize() };
    }

    result
}

#[tauri::command]
pub async fn get_dnd_state() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(|| unsafe {
        with_settings(|settings| {
            let mut profile = PWSTR::null();
            settings.read_user_selected_profile(&mut profile).ok()?;

            if profile.is_null() {
                return Ok("off".to_string());
            }

            let value = profile.to_string().unwrap_or_default();
            CoTaskMemFree(Some(profile.as_ptr() as *const core::ffi::c_void));
            Ok(profile_to_mode(&value))
        })
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn set_dnd_state(mode: String) -> Result<(), String> {
    let profile = mode_to_profile(&mode).ok_or_else(|| format!("invalid DND mode: {mode}"))?;

    tauri::async_runtime::spawn_blocking(move || unsafe {
        let wide: Vec<u16> = profile.encode_utf16().chain(std::iter::once(0)).collect();
        with_settings(|settings| settings.write_user_selected_profile(wide.as_ptr()).ok())
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_modes_to_profiles() {
        assert_eq!(mode_to_profile("off"), Some(PROFILE_UNRESTRICTED));
        assert_eq!(mode_to_profile("disabled"), Some(PROFILE_UNRESTRICTED));
        assert_eq!(mode_to_profile("priority"), Some(PROFILE_PRIORITY));
        assert_eq!(mode_to_profile("on"), Some(PROFILE_PRIORITY));
        assert_eq!(mode_to_profile("alarms"), Some(PROFILE_ALARMS));
        assert_eq!(mode_to_profile("bogus"), None);
    }

    #[test]
    fn maps_profiles_to_modes() {
        assert_eq!(profile_to_mode(PROFILE_UNRESTRICTED), "off");
        assert_eq!(profile_to_mode(PROFILE_PRIORITY), "priority");
        assert_eq!(profile_to_mode(PROFILE_ALARMS), "alarms");
    }

    #[test]
    fn unknown_profile_falls_back_to_unknown() {
        // Custom Focus sessions store a profile GUID we don't recognize; the UI
        // treats "unknown" as not-enabled rather than guessing.
        assert_eq!(
            profile_to_mode("Microsoft.QuietHoursProfile.CustomSession"),
            "unknown"
        );
    }

    #[test]
    fn mode_profile_round_trips() {
        for mode in ["off", "priority", "alarms"] {
            let profile = mode_to_profile(mode).expect("known mode");
            assert_eq!(profile_to_mode(profile), mode);
        }
    }
}
