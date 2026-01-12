import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const integrations = [
  {
    name: "Stripe",
    type: "Finance",
    rate: 40,
    profit: "$650.00",
    color: "bg-violet-500",
    icon: "S",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    name: "Zapier",
    type: "CRM",
    rate: 60,
    profit: "$720.50",
    color: "bg-orange-500",
    icon: "Z",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    name: "Shopify",
    type: "Marketplace",
    rate: 20,
    profit: "$432.25",
    color: "bg-green-500",
    icon: "S",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
]

export function IntegrationList() {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-400" />
          <CardTitle className="text-base font-medium">List of Integration</CardTitle>
        </div>
        <button className="text-sm text-cyan-500 hover:underline">See All</button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground pb-2">
            <span>APPLICATION</span>
            <span>TYPE</span>
            <span>RATE</span>
            <span className="text-right">PROFIT</span>
          </div>
          {integrations.map((integration) => (
            <div key={integration.name} className="grid grid-cols-4 gap-4 items-center py-3 border-t border-border">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${integration.iconBg}`}>
                  <span className={`text-sm font-semibold ${integration.iconColor}`}>{integration.icon}</span>
                </div>
                <span className="font-medium text-foreground">{integration.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{integration.type}</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={integration.rate}
                  className="h-1.5 w-16"
                  style={{
                    // @ts-ignore
                    "--progress-color": integration.color.replace("bg-", ""),
                  }}
                />
                <span className="text-sm text-muted-foreground">{integration.rate}%</span>
              </div>
              <span className="text-right font-medium text-foreground">{integration.profit}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
