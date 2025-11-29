import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginButton } from "@/components/auth/LoginButton";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/icons/Logo";

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find(img => img.id === 'login-background');

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          data-ai-hint={bgImage.imageHint}
          fill
          className="object-cover opacity-10"
        />
      )}
      <Card className="relative z-10 w-full max-w-sm glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Connect your Deriv account to start trading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  );
}
