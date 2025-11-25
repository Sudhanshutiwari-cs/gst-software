"use client"

import { ChevronLeft, Check } from "lucide-react"

interface Template {
  id: string
  name: string
  preview: string
}

const templates: Template[] = [
  { id: "modern", name: "Modern", preview: "https://res.cloudinary.com/doficc2yl/image/upload/v1764054365/Template_1_xleypm.png" },
  { id: "classic", name: "Classic", preview: "https://res.cloudinary.com/doficc2yl/image/upload/v1764054772/Template_2_uysbdz.png" },
  { id: "mrp-discount", name: "MRP + Discount", preview: "https://res.cloudinary.com/doficc2yl/image/upload/v1764067405/Template_3_vfci1z.png" },

]

interface TemplateSidebarProps {
  selectedTemplate: string
  onSelectTemplate: (id: string) => void
}

export function TemplateSidebar({ selectedTemplate, onSelectTemplate }: TemplateSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Select your favourite template!</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`w-full rounded-lg border-2 p-2 transition-all hover:border-primary/50 ${
              selectedTemplate === template.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="relative aspect-[3/4] bg-muted rounded overflow-hidden mb-2">
              <img
                src={template.preview || "/placeholder.svg"}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium flex items-center gap-1.5 justify-center">
              {template.name}
              {selectedTemplate === template.id && <Check className="h-4 w-4 text-primary" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}