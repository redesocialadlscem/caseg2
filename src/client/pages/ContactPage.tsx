import { type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

const CONTACT_EMAIL = 'contato@casegprotege.com.br';
const WHATSAPP_NUMBER = '5513997942803';

function handleContactSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const name = String(form.get('name') || '');
  const email = String(form.get('email') || '');
  const message = String(form.get('message') || '');
  const subject = encodeURIComponent(`Contato pelo site — ${name}`);
  const body = encodeURIComponent(`Nome: ${name}\nE-mail: ${email}\n\n${message}`);
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function openWhatsApp() {
  const text = encodeURIComponent('Olá! Vim pelo site da CASEG Protege e gostaria de mais informações.');
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
}

export function ContactPage() {
  return (
    <div className="min-h-screen bg-white font-body text-black">
      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 border-b-2 border-black bg-emerald-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white border-2 border-black rounded-xl shadow-brutal-sm">
              <MessageSquare size={16} className="text-brand" />
              <span className="font-display font-bold text-xs uppercase tracking-widest text-brand">
                Fale Conosco
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-[1.05] mb-4">
              Entre em <span className="text-brand">Contato</span>
            </h1>
            <p className="font-body text-lg text-gray-700 max-w-2xl mx-auto">
              Estamos prontos para ajudar. Envie sua mensagem ou encontre nossos canais de atendimento.
            </p>
          </div>
        </section>

        {/* Map + Contact Info */}
        <section className="py-16 border-b-2 border-black">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              {/* Map */}
              <div className="rounded-xl border-2 border-black overflow-hidden shadow-brutal">
                <iframe
                  title="Localização CASEG Protege — Cajati, SP"
                  src="https://www.google.com/maps?q=Cajati+SP+Brasil&output=embed"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full min-h-[400px]"
                />
              </div>

              {/* Contact Info Cards */}
              <div className="grid gap-6">
                <div className="rounded-xl border-2 border-black bg-white p-8 shadow-brutal">
                  <div className="mb-6 flex items-center gap-4 text-brand">
                    <Mail size={28} />
                    <div>
                      <p className="font-display font-bold text-xl">E-mail</p>
                      <p className="font-body text-sm text-gray-600">{CONTACT_EMAIL}</p>
                    </div>
                  </div>
                  <div className="mb-6 flex items-center gap-4 text-brand">
                    <Phone size={28} />
                    <div>
                      <p className="font-display font-bold text-xl">Telefone</p>
                      <p className="font-body text-sm text-gray-600">(13) 99794-2803</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-brand">
                    <MapPin size={28} />
                    <div>
                      <p className="font-display font-bold text-xl">Endereço</p>
                      <p className="font-body text-sm text-gray-600">
                        Cajati, SP — Brasil
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={openWhatsApp}
                  className="w-full rounded-xl border-2 border-black bg-green-600 p-6 text-white shadow-brutal brutal-interactive hover:bg-green-700 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
                      <MessageSquare size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg">Fale pelo WhatsApp</p>
                      <p className="font-body text-sm text-green-100 mt-1">Resposta mais rápida para dúvidas urgentes</p>
                    </div>
                  </div>
                </button>

                <div className="rounded-xl border-2 border-black bg-black p-6 text-white shadow-brutal">
                  <p className="font-display font-bold text-xl">Atendimento rápido</p>
                  <p className="mt-3 font-body text-sm leading-relaxed text-gray-300">
                    Nosso time está disponível para responder dúvidas sobre cursos, propostas para empresas e parcerias.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 border-b-2 border-black">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-sm uppercase tracking-[0.3em] text-brand font-bold">Envie sua mensagem</p>
                <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">Preencha o formulário</h2>
              </div>

              <Card className="border-2 border-black rounded-xl p-8 shadow-brutal">
                <form className="space-y-5" onSubmit={handleContactSubmit}>
                  <div>
                    <label htmlFor="contact-name" className="font-display font-bold text-sm uppercase tracking-wide block mb-2">
                      Nome
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 font-body focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/30"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="font-display font-bold text-sm uppercase tracking-wide block mb-2">
                      E-mail
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 font-body focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/30"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="font-display font-bold text-sm uppercase tracking-wide block mb-2">
                      Mensagem
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      required
                      className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 font-body focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/30"
                      placeholder="Como podemos ajudar?"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="lg" className="w-full justify-center">
                    Enviar Mensagem
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white border-t-4 border-brand">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display font-bold text-xl mb-2">CASEG Protege</h3>
              <p className="font-body text-sm text-gray-400">Capacitando profissionais com excelência em segurança do trabalho.</p>
            </div>
            <div className="flex gap-6">
              <Link to="/" className="font-body text-sm text-gray-400 hover:text-brand transition-colors">Início</Link>
              <Link to="/courses" className="font-body text-sm text-gray-400 hover:text-brand transition-colors">Cursos</Link>
              <Link to="/contato" className="font-body text-sm text-gray-400 hover:text-brand transition-colors">Contato</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center font-body text-sm text-gray-500">
            © 2025 CASEG Protege. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
