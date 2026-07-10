import "./i18n";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AdsList from "@/pages/AdsList";
import Publicites from "@/pages/Publicites";
import PostAd from "@/pages/PostAd";
import AdDetail from "@/pages/AdDetail";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import { Legal, CGU, Privacy } from "@/pages/Legal";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Tarifs from "@/pages/Tarifs";
import Dons from "@/pages/Dons";
import EspaceCommercant from "@/pages/EspaceCommercant";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminForgotPassword from "@/pages/AdminForgotPassword";
import AdminResetPassword from "@/pages/AdminResetPassword";
import VideoTemplate from "@/components/video/VideoTemplate";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/annonces" component={AdsList} />
      <Route path="/annonces/:id" component={AdDetail} />
      <Route path="/publicites" component={Publicites} />
      <Route path="/deposer" component={PostAd} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/connexion" component={Login} />
      <Route path="/inscription">
        <Register />
      </Route>
      <Route path="/inscription-marchand">
        <Register defaultRole="merchant" />
      </Route>
      <Route path="/tarifs" component={Tarifs} />
      <Route path="/dons" component={Dons} />
      <Route path="/espace-commercant" component={EspaceCommercant} />
      <Route path="/mot-de-passe-oublie" component={ForgotPassword} />
      <Route path="/reinitialisation-mot-de-passe" component={ResetPassword} />
      <Route path="/admin/mot-de-passe-oublie" component={AdminForgotPassword} />
      <Route path="/admin/reinitialisation" component={AdminResetPassword} />
      <Route path="/mentions-legales" component={Legal} />
      <Route path="/cgu" component={CGU} />
      <Route path="/politique-confidentialite" component={Privacy} />
      <Route path="/video" component={VideoTemplate} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
