import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createNeed } from "@/lib/api";

interface ReportEmergencyFormValues {
  category: string;
  zone: string;
  severity: number;
  people_affected: number;
}

export default function ReportEmergency() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const form = useForm<ReportEmergencyFormValues>({
    defaultValues: {
      category: "",
      zone: "",
      severity: 3,
      people_affected: 1,
    },
  });

  const onSubmit = async (data: ReportEmergencyFormValues) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      console.log("Submitting to Supabase...", data);
      
      await createNeed({
        category: data.category,
        zone: data.zone,
        severity: data.severity,
        people_affected: data.people_affected,
        status: "pending",
      });

      setSubmitStatus("success");
      form.reset();
    } catch (err) {
      console.error("Error inserting need:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/20 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="bg-primary/5 border-b border-border text-center pb-8 pt-8">
          <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Report an Emergency
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Please provide details so we can dispatch the right volunteers immediately.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {submitStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <h3 className="text-xl font-bold">Emergency Reported</h3>
              <p className="text-center text-muted-foreground">
                Help is on the way. The coordinator has been notified and our system is automatically matching volunteers.
              </p>
              <Button onClick={() => setSubmitStatus("idle")} variant="outline" className="mt-4">
                Report Another Emergency
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {submitStatus === "error" && (
                  <div className="p-3 bg-red-100/50 text-red-700 text-sm rounded border border-red-200">
                    Failed to submit. Please try again.
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="category"
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What do you need most?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an emergency category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="water">Water</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="shelter">Shelter</SelectItem>
                          <SelectItem value="sanitation">Sanitation</SelectItem>
                          <SelectItem value="psychosocial">Psychosocial</SelectItem>
                          <SelectItem value="livelihood">Livelihood</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zone"
                  rules={{ required: "Zone is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Zone)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your current zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ward_1">Ward 1</SelectItem>
                          <SelectItem value="Ward_2">Ward 2</SelectItem>
                          <SelectItem value="Ward_3">Ward 3</SelectItem>
                          <SelectItem value="Ward_4">Ward 4</SelectItem>
                          <SelectItem value="Ward_5">Ward 5</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="people_affected"
                  rules={{ required: true, min: 1 }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of People Affected</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Severity Level</FormLabel>
                        <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          {field.value} / 5
                        </span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-2"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Low (1)</span>
                        <span>Moderate (3)</span>
                        <span>Critical (5)</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full text-lg h-12 mt-4 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Emergency Request"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
