import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LoginButton } from "@/components/auth/LoginButton";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/icons/Logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

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
      <Card className="relative z-10 w-full max-w-md glass-card">
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
        <CardFooter>
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Getting a 403 Error?</AlertTitle>
            <AlertDescription>
              Make sure to add your application's URL to the list of authorized redirect URLs in your Deriv app settings. 
              For development, this is often `http://localhost:9002/oauth/callback`.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}
