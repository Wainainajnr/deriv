import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function TermsAndConditions() {
  return (
    <Card className="glass-card mt-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <FileText className="h-6 w-6 text-muted-foreground mt-1" />
          <div>
            <h4 className="font-bold">Terms and Conditions</h4>
            <p className="text-xs text-muted-foreground mt-2">
              By using DerivEdge ("the Service"), you agree to be bound by these Terms and Conditions. The Service provides AI-generated trading analysis for informational purposes only. It does not constitute financial advice.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              You are solely responsible for all trading decisions and outcomes. We are not liable for any financial losses you may incur. The Service is provided "as is" without any warranties. We reserve the right to modify or terminate the Service at any time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
