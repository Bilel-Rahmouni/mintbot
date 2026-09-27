import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./lib/auth";
import { PageSpinner } from "./components/ui/Spinner";
import { Shell } from "./components/Shell";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { SignupScreen } from "./screens/auth/SignupScreen";
import { BotsScreen } from "./screens/bots/BotsScreen";
import { BotScreen } from "./screens/bot/BotScreen";
import { SourcesTab } from "./screens/bot/SourcesTab";
import { AppearanceTab } from "./screens/bot/AppearanceTab";
import { EmbedTab } from "./screens/bot/EmbedTab";
import { ConversationsTab } from "./screens/bot/ConversationsTab";
import { ConversationView } from "./screens/bot/ConversationView";
import { PlaygroundTab } from "./screens/bot/PlaygroundTab";
import { FormsScreen } from "./screens/forms/FormsScreen";
import { FormScreen } from "./screens/form/FormScreen";
import { BuilderTab } from "./screens/form/BuilderTab";
import { FormEmbedTab } from "./screens/form/FormEmbedTab";
import { SubmissionsTab } from "./screens/form/SubmissionsTab";
import { InsightsTab } from "./screens/form/InsightsTab";
import { BillingScreen } from "./screens/billing/BillingScreen";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/bots" replace />} />
        <Route path="/bots" element={<BotsScreen />} />
        <Route path="/bots/:botId" element={<BotScreen />}>
          <Route index element={<Navigate to="sources" replace />} />
          <Route path="sources" element={<SourcesTab />} />
          <Route path="appearance" element={<AppearanceTab />} />
          <Route path="embed" element={<EmbedTab />} />
          <Route path="conversations" element={<ConversationsTab />} />
          <Route path="conversations/:conversationId" element={<ConversationView />} />
          <Route path="playground" element={<PlaygroundTab />} />
        </Route>
        <Route path="/forms" element={<FormsScreen />} />
        <Route path="/forms/:formId" element={<FormScreen />}>
          <Route index element={<Navigate to="builder" replace />} />
          <Route path="builder" element={<BuilderTab />} />
          <Route path="embed" element={<FormEmbedTab />} />
          <Route path="submissions" element={<SubmissionsTab />} />
          <Route path="insights" element={<InsightsTab />} />
        </Route>
        <Route path="/billing" element={<BillingScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/bots" replace />} />
    </Routes>
  );
}
