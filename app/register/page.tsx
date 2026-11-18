import RegisterForm from "./RegisterForm";
import { getAuthPanelImage } from "@/lib/auth-panel";

export default async function RegisterPage() {
  const panelImage = await getAuthPanelImage();
  return <RegisterForm panelImage={panelImage} />;
}
