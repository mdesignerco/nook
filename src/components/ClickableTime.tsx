import { motion, AnimatePresence } from "framer-motion";
import { BellRing, Repeat } from "lucide-react";

interface ClickableTimeProps {
	time: string;
	timerSeconds: number;
	isTimerFinished: boolean;
	formatTimer: (seconds: number) => string;
	onClick: (e: React.MouseEvent) => void;
	showUpdateDot?: boolean;
	small?: boolean;
	cycleHint?: boolean;
}

export function ClickableTime({
	time,
	timerSeconds,
	isTimerFinished,
	formatTimer,
	onClick,
	showUpdateDot,
	small,
	cycleHint
}: ClickableTimeProps) {
	return (
		<div className={`time-center${small ? " time-center-small" : ""}`}>
			<div className="time-flip-container" onClick={onClick}>
				<AnimatePresence initial={false}>
					{timerSeconds > 0 || isTimerFinished ? (
						<motion.span
							key="timer"
							className={`time compact-timer ${isTimerFinished ? "timer-finished" : ""}`}
							initial={{ rotateX: -90, opacity: 0 }}
							animate={{ rotateX: 0, opacity: 1 }}
							exit={{ rotateX: 90, opacity: 0 }}
							transition={{ type: "spring", stiffness: 600, damping: 30 }}
						>
							{isTimerFinished && <BellRing size={13} strokeWidth={2.5} className="timer-bell" />}
							{formatTimer(timerSeconds)}
						</motion.span>
					) : (
						<motion.span
							key="clock"
							className="time"
							initial={{ rotateX: -90, opacity: 0 }}
							animate={{ rotateX: 0, opacity: 1 }}
							exit={{ rotateX: 90, opacity: 0 }}
							transition={{ type: "spring", stiffness: 600, damping: 30 }}
						>
							{time}
							{cycleHint && (
								<Repeat size={9} strokeWidth={3} className="mode-cycle-hint" aria-hidden="true" />
							)}
						</motion.span>
					)}
				</AnimatePresence>
			</div>
			{showUpdateDot && <div className="update-dot" />}
		</div>
	);
}
