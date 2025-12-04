import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PageReveal } from './components/PageReveal';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { LocalBusinessSchema } from './components/LocalBusinessSchema';
import { HomePage } from './pages/HomePage';
import { LeistungenPage } from './pages/LeistungenPage';
import { CasesPage } from './pages/CasesPage';
import { AblaufPage } from './pages/AblaufPage';
import { UeberUnsPage } from './pages/UeberUnsPage';
import { FAQPage } from './pages/FAQPage';
import { KontaktPage } from './pages/KontaktPage';

function App() {
  return (
    <Router>
      <LocalBusinessSchema />
      <PageReveal>
        <div className="min-h-screen bg-[#fafafa] text-gray-900">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leistungen" element={<LeistungenPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/ablauf" element={<AblaufPage />} />
            <Route path="/ueber-uns" element={<UeberUnsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/kontakt" element={<KontaktPage />} />
          </Routes>
          <Footer />
        </div>
      </PageReveal>
    </Router>
  );
}

export default App;
