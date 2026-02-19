import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PageReveal } from './components/PageReveal';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { PremiumFooterReveal } from './components/PremiumFooterReveal';
import { LocalBusinessSchema } from './components/LocalBusinessSchema';
import { CityServicePage } from './components/CityServicePage';
import { HomePage } from './pages/HomePage';
import { LeistungenPage } from './pages/LeistungenPage';
import { UeberUnsPage } from './pages/UeberUnsPage';
import { FAQPage } from './pages/FAQPage';
import { KontaktPage } from './pages/KontaktPage';
import { BayernPage } from './pages/BayernPage';
import { CITY_SERVICE_CONFIGS } from './lib/standorte-data';

function App() {
  return (
    <Router>
      <LocalBusinessSchema />
      <PageReveal>
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leistungen" element={<LeistungenPage />} />
            <Route path="/ueber-uns" element={<UeberUnsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/kontakt" element={<KontaktPage />} />
            <Route path="/bayern" element={<BayernPage />} />
            {Object.values(CITY_SERVICE_CONFIGS).map((config) => (
              <Route
                key={config.route}
                path={config.route}
                element={<CityServicePage config={config} />}
              />
            ))}
          </Routes>
          <PremiumFooterReveal>
            <Footer />
          </PremiumFooterReveal>
        </div>
      </PageReveal>
    </Router>
  );
}

export default App;
