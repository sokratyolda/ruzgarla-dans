/** Bir ekranda beklenmedik bir hata olursa bütün uygulama boşalmasın: sakin bir mesaj göster. */
import { Component, type ReactNode } from 'react';

export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Başka bir ekrana geçilince hatayı unut
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fade" style={{ paddingTop: 40 }}>
        <div className="eyebrow">Bir şey ters gitti</div>
        <h2>Bu ekran açılamadı.</h2>
        <p className="small muted">
          Yazdıkların cihazda güvende; bu yalnızca ekranın kendisiyle ilgili bir sorun. Başka bir ekrana geçip yeniden
          deneyebilirsin.
        </p>
        <pre className="tiny faint" style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
        <a className="btn block" href="#/today" style={{ marginTop: 16 }}>Bugün'e dön</a>
      </div>
    );
  }
}
