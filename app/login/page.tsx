import LoginForm from "./LoginForm";
import { getAuthPanelImage } from "@/lib/auth-panel";

export default async function LoginPage() {
  const panelImage = await getAuthPanelImage();
  return <LoginForm panelImage={panelImage} />;
}
