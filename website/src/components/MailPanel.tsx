import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const messages = [
	{ from: "Carolina · PeakU", subject: "QT Developer / OpenText — nueva oportunidad" },
	{ from: "Design team", subject: "Revisión de diseño: próximos pasos" },
	{ from: "Alex Morgan", subject: "Your project is ready for review" },
	{ from: "Calendar", subject: "Recordatorio: reunión de equipo mañana" },
	{ from: "Nook", subject: "Welcome to your quieter workspace" }
];

export default function MailPanel({ onClose }: { onClose: () => void }) {
	const [index, setIndex] = useState(0);
	return <section className="demo-mail-panel" aria-label="Gmail demo" onClick={e => e.stopPropagation()}>
		<header><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M2 6h4v14H2z"/><path fill="#34a853" d="M18 6h4v14h-4z"/><path fill="#ea4335" d="M2 4v5l10 7 10-7V4l-10 7z"/><path fill="#fbbc04" d="M18 6l4-2v5l-4 3z"/></svg><strong>Gmail</strong><span>5 unread</span></header>
		<div className="demo-mail-message" role="status"><span>{messages[index].from}</span><strong>{messages[index].subject}</strong></div>
		<footer><button onClick={onClose}>Back</button><nav aria-label="Unread messages"><button aria-label="Previous message" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={16} /></button><span>{index + 1} / {messages.length}</span><button aria-label="Next message" disabled={index === messages.length - 1} onClick={() => setIndex(index + 1)}><ChevronRight size={16} /></button></nav><a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">Open Gmail ↗</a></footer>
	</section>;
}
