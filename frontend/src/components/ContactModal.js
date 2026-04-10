import { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';

export function ContactModal({ isOpen, onClose, userName, userEmail }) {
  const [name, setName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/email/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() })
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setTimeout(() => { onClose(); setSent(false); setMessage(''); }, 2000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div data-testid="contact-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Contact Us</h2>
          </div>
          <button data-testid="close-contact-btn" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-slate-900">Message Sent!</p>
            <p className="text-sm text-slate-500 mt-1">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Name</label>
              <input
                data-testid="contact-name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Email</label>
              <input
                data-testid="contact-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Message</label>
              <textarea
                data-testid="contact-message-input"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="How can we help?"
                required
              />
            </div>
            <button
              data-testid="contact-submit-btn"
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
