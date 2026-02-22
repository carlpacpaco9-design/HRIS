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
import { toast } from "sonner"
import { addMonitoringTask, updateMonitoringTask } from "@/app/actions/monitoring"
import { MonitoringJournal, MonitoringTask } from "@/types/monitoring"

const taskSchema = z.object({
    task_id_no: z.string().optional(),
    subject: z.string().min(3, "Subject is required"),
    action_officer_id: z.string().min(1, "Action officer is required"),
    output: z.string().optional(),
    date_assigned: z.string().optional(),
    date_accomplished: z.string().optional(),
    remarks: z.string().max(300, "Remarks cannot exceed 300 characters").optional()
})

type TaskFormValues = z.infer<typeof taskSchema>

interface TaskDialogProps {
    isOpen: boolean
    onClose: () => void
    journal: MonitoringJournal
    initialData?: MonitoringTask
    employees: any[]
}

export function TaskDialog({
    isOpen,
    onClose,
    journal,
    initialData,
    employees
}: TaskDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            task_id_no: "",
            subject: "",
            action_officer_id: "",
            output: "",
            date_assigned: new Date().toISOString().split('T')[0],
            date_accomplished: "",
            remarks: ""
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                task_id_no: initialData.task_id_no || "",
                subject: initialData.subject,
                action_officer_id: initialData.action_officer_id || "",
                output: initialData.output || "",
                date_assigned: initialData.date_assigned || "",
                date_accomplished: initialData.date_accomplished || "",
                remarks: initialData.remarks || ""
            })
        } else {
            form.reset({
                task_id_no: "",
                subject: "",
                action_officer_id: "",
                output: "",
                date_assigned: new Date().toISOString().split('T')[0],
                date_accomplished: "",
                remarks: ""
            })
        }
    }, [initialData, form, isOpen])

    const onSubmit = async (values: TaskFormValues) => {
        setIsSubmitting(true)
        try {
            // Transform empty strings to null for optional date fields if needed, 
            // but the database handles empty string/null depending on the Supabase client
            const formattedValues = {
                ...values,
                date_assigned: values.date_assigned || undefined,
                date_accomplished: values.date_accomplished || undefined
            }

            if (initialData) {
                const res = await updateMonitoringTask(initialData.id, formattedValues)
                if (res.error) throw new Error(res.error)
                toast.success("Task updated successfully")
            } else {
                const res = await addMonitoringTask(journal.id, formattedValues)
                if (res.error) throw new Error(res.error)
                toast.success("Task added successfully")
            }
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit" : "Add"} monitoring Task</DialogTitle>
                    <DialogDescription>
                        Annex J — Task Tracking Tool for Monitoring Assignments.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="task_id_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Task / Document No.</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 2026-001" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px]">Reference No. from WFP</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="action_officer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Action Officer</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select officer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {employees.map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <Input placeholder="What is the task about?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="output"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expected Output</FormLabel>
                                    <FormControl>
                                        <Input placeholder="What is the expected result?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date_assigned"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date Assigned</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="date_accomplished"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date Accomplished</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px]">Leave blank if pending</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional notes about the task..."
                                            className="h-20 resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : (initialData ? "Update Task" : "Save Task")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
