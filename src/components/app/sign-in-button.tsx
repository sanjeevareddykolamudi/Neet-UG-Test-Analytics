import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const { loginDemo } = useAuth();
  return (
    <Button className="w-full" onClick={() => loginDemo("demo@example.com")}>
      Continue as Demo
    </Button>
  );
}
