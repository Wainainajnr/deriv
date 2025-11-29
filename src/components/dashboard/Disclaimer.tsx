
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function Disclaimer() {
  return (
    <Card className="glass-card mt-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mt-1" />
          <div>
            <h4 className="font-bold text-yellow-500">Risk Disclaimer</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Trading involves a high level of risk and may not be suitable for all investors. The AI-generated suggestions provided by this tool are for informational purposes only and should not be considered financial advice. Past performance is not indicative of future results. You are solely responsible for your own trading decisions and any resulting losses.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
