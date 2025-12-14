import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function AccordionDemo() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Enhanced Accordion Demo</h1>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>What makes this accordion design better?</AccordionTrigger>
          <AccordionContent>
            The enhanced accordion features improved visual styling with:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Smooth hover effects and transitions</li>
              <li>Modern shadow effects on hover</li>
              <li>Better spacing and padding</li>
              <li>Improved chevron animation</li>
              <li>Distinct open/closed states</li>
              <li>Primary color accents for better visual hierarchy</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2">
          <AccordionTrigger>How does the animation work?</AccordionTrigger>
          <AccordionContent>
            The accordion uses CSS transitions for smooth animations:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Chevron rotates 180° when opened</li>
              <li>Content slides down/up with height animation</li>
              <li>Hover effects on the entire item</li>
              <li>Shadow transitions for depth perception</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3">
          <AccordionTrigger>Can I customize the styling further?</AccordionTrigger>
          <AccordionContent>
            Yes! You can customize the accordion by:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Passing additional className props</li>
              <li>Modifying the tailwind.config.ts file</li>
              <li>Adjusting the theme colors in CSS variables</li>
              <li>Extending the component with your own variants</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default AccordionDemo;