'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { addMonitoringEntry, updateMonitoringEntry } from "@/app/actions/monitoring"
import { MonitoringJournal, MonitoringEntry } from "@/types/monitoring"

const activitySchema = z.object({
    activity_type: z.enum(['monitoring', 'coaching']),
    mechanism: z.enum(['one_on_one', 'group_meeting', 'memo', 'field_visit', 'email', 'other']),
    mechanism_other: z.string().optional(),
    activity_date: z.string().min(1, "Date is required"),
    participants: z.array(z.string()).min(1, "At least one participant is required"),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional()
})

type ActivityFormValues = z.infer<typeof activitySchema>

interface ActivityDialogProps {
    isOpen: boolean
    onClose: () => void
    journal: MonitoringJournal
    activityType: 'monitoring' | 'coaching'
    initialData?: MonitoringEntry
    employees: any[]
}

export function ActivityDialog({
    isOpen,
    onClose,
    journal,
    activityType,
    initialData,
    employees
}: ActivityDialogProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ActivityFormValues>({
        resolver: zodResolver(activitySchema),
        defaultValues: {
            activity_type: activityType,
            mechanism: 'one_on_one',
            mechanism_other: "",
            activity_date: new Date().toISOString().split('T')[0],
            participants: [],
            notes: ""
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                activity_type: initialData.activity_type,
                mechanism: initialData.mechanism,
                mechanism_other: initialData.mechanism_other || "",
                activity_date: initialData.activity_date,
                participants: initialData.participants,
                notes: initialData.notes || ""
            })
        } else {
            form.reset({
                activity_type: activityType,
                mechanism: 'one_on_one',
                mechanism_other: "",
                activity_date: new Date().toISOString().split('T')[0],
                participants: [],
                notes: ""
            })
        }
    }, [initialData, activityType, form, isOpen])

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const onSubmit = async (values: ActivityFormValues) => {
        setIsSubmitting(true)
        try {
            if (initialData) {
                const res = await updateMonitoringEntry(initialData.id, values)
                if (res.error) throw new Error(res.error)
                toast.success("Activity updated successfully")
            } else {
                const res = await addMonitoringEntry(journal.id, values)
                if (res.error) throw new Error(res.error)
                toast.success("Activity added successfully")
            }
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedMechanism = form.watch("mechanism")

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit" : "Add"} {activityType === 'monitoring' ? 'Monitoring' : 'Coaching'} Activity</DialogTitle>
                    <DialogDescription>
                        Annex H — Record a {activityType} session.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="mechanism"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mechanism</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select mechanism" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="one_on_one">One-on-One Meeting</SelectItem>
                                                <SelectItem value="group_meeting">Group Meeting</SelectItem>
                                                <SelectItem value="memo">Written Memo</SelectItem>
                                                <SelectItem value="field_visit">Field Visit</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="activity_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {selectedMechanism === 'other' && (
                            <FormField
                                control={form.control}
                                name="mechanism_other"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Specify Mechanism</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Describe the mechanism..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="participants"
                            render={() => (
                                <FormItem>
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel>Participants</FormLabel>
                                        <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold">
                                            {form.watch("participants").length} Selected
                                        </span>
                                    </div>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search employees..."
                                            className="pl-8 h-9 text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="border rounded-md bg-slate-50/50">
                                        <ScrollArea className="h-[150px] p-2">
                                            <div className="space-y-1">
                                                {filteredEmployees.map((emp) => (
                                                    <div key={emp.id} className="flex items-center space-x-2 p-1.5 hover:bg-white rounded transition-colors">
                                                        <Checkbox
                                                            id={`emp-${emp.id}`}
                                                            checked={form.watch("participants").includes(emp.full_name)}
                                                            onChange={(e) => {
                                                                const current = form.getValues("participants")
                                                                if (e.target.checked) {
                                                                    form.setValue("participants", [...current, emp.full_name])
                                                                } else {
                                                                    form.setValue("participants", current.filter(id => id !== emp.full_name))
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`emp-${emp.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                                                            {emp.full_name}
                                                            <span className="block text-[10px] text-muted-foreground font-normal">{emp.position_title}</span>
                                                        </label>
                                                    </div>
                                                ))}
                                                {filteredEmployees.length === 0 && (
                                                    <div className="text-center py-4 text-xs text-muted-foreground">No employees found</div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What was discussed or observed?"
                                            className="min-h-[100px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="flex justify-end">
                                        <span className={cn("text-[10px]", (field.value?.length || 0) > 450 ? "text-destructive" : "text-muted-foreground")}>
                                            {(field.value?.length || 0)}/500
                                        </span>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : (initialData ? "Update Activity" : "Save Activity")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
