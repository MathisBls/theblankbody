import { Redirect, Route, Switch } from 'wouter';
import { ROUTES } from './config/routes';
import { HomePage } from './pages/HomePage/HomePage';
import { PRIVACY_DOCUMENT, TERMS_DOCUMENT } from './pages/LegalPage/legalDocuments';
import { LegalPage } from './pages/LegalPage/LegalPage';
import { ProductPage } from './pages/ProductPage/ProductPage';
import { Footer } from './sections/Footer/Footer';
import { Header } from './sections/Header/Header';

export default function App() {
  return (
    <>
      <Header />
      <Switch>
        <Route path={ROUTES.home} component={HomePage} />
        <Route path={ROUTES.product}>{(params) => <ProductPage slug={params.slug} />}</Route>
        <Route path={ROUTES.terms}>
          <LegalPage document={TERMS_DOCUMENT} />
        </Route>
        <Route path={ROUTES.privacy}>
          <LegalPage document={PRIVACY_DOCUMENT} />
        </Route>
        <Route>
          <Redirect to={ROUTES.home} />
        </Route>
      </Switch>
      <Footer />
    </>
  );
}
