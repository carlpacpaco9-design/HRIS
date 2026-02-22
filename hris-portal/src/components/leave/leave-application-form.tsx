'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Zod Schema for Leave Application
 */
const leaveSchema = z.object({
    leave_type: z.enum(['Vacation', 'Sick', 'Maternity', 'Paternity', 'SPL', 'Forced', 'Others']),
    details: z.string().min(3, "Please provide specific details"),
    inclusive_dates: z.string().min(5, "Please specify dates (e.g., Jan 1-3, 2026)"),
    number_of_days: z.coerce.number().min(0.5, "Minimum 0.5 days required"),
    commutation: z.enum(['Requested', 'Not Requested']).default('Not Requested'),
})

type LeaveFormValues = z.infer<typeof leaveSchema>

interface LeaveBalance {
    vacation_balance: number
    sick_balance: number
    spl_balance: number
}

/**
 * LeaveApplicationForm Component
 * Employee-facing interface to apply for leave (CSC Form 6)
 */
export function LeaveApplicationForm() {
    const [balances, setBalances] = useState<LeaveBalance | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    // 1. Initialize Form
    const form = useForm<LeaveFormValues>({
        resolver: zodResolver(leaveSchema) as any,
        defaultValues: {
            leave_type: 'Vacation',
            commutation: 'Not Requested',
            number_of_days: 1,
        }
    })

    // 2. Fetch Initial Balances
    useEffect(() => {
        async function loadBalances() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('leave_balances')
                .select('vacation_balance, sick_balance, spl_balance')
                .eq('employee_id', user.id)
                .single()

            if (!error && data) {
                setBalances(data as LeaveBalance)
            } else if (error && error.code === 'PGRST116') {
                // No balance record yet - initialize with defaults for UI
                setBalances({ vacation_balance: 0, sick_balance: 0, spl_balance: 3 })
            }
            setIsLoading(false)
        }
        loadBalances()
    }, [])

    // 3. Handle Form Submission
    async function onSubmit(values: LeaveFormValues) {
        if (!balances) return

        // VALDIATION: Check against balances
        const currentType = values.leave_type
        let available = 0
        if (currentType === 'Vacation') available = balances.vacation_balance
        else if (currentType === 'Sick') available = balances.sick_balance
        else if (currentType === 'SPL') available = balances.spl_balance
        else available = 999 // Maternity/Paternity/Others don't typically use these credit pools directly here

        if (values.number_of_days > available && ['Vacation', 'Sick', 'SPL'].includes(currentType)) {
            toast.error(`Insufficient balance. You only have ${available} days available for ${currentType} leave.`)
            return
        }

        setIsSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error } = await supabase
                .from('leave_applications')
                .insert({
                    employee_id: user.id,
                    leave_type: values.leave_type,
                    details_of_leave: values.details,
                    number_of_days: values.number_of_days,
                    inclusive_dates: values.inclusive_dates,
                    commutation: values.commutation,
                    status: 'Pending'
                })

            if (error) throw error

            toast.success("Application submitted successfully!")
            form.reset()
        } catch (err: any) {
            toast.error(err.message || "Failed to submit application")
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedType = form.watch('leave_type')

    if (isLoading) {
        return <div className="p-10 text-center animate-pulse">Loading leave credits...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* 1. BALANCE OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Vacation Leave', value: balances?.vacation_balance || 0, icon: <CalendarIcon className="w-4 h-4 text-blue-500" /> },
                    { label: 'Sick Leave', value: balances?.sick_balance || 0, icon: <Clock className="w-4 h-4 text-orange-500" /> },
                    { label: 'Special Privilege', value: balances?.spl_balance || 0, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
                ].map((item, i) => (
                    <Card key={i} className="border-none shadow-sm bg-muted/30">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{item.label}</span>
                                {item.icon}
                            </div>
                            <p className="text-3xl font-black">{item.value.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 tracking-tighter">Available Credits</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 2. APPLICATION FORM */}
            <Card className="border shadow-none">
                <CardHeader className="bg-muted/10 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Application for Leave (Form 6)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Type of Leave */}
                                <FormField
                                    control={form.control}
                                    name="leave_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase">Type of Leave</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Vacation">Vacation Leave</SelectItem>
                                                    <SelectItem value="Sick">Sick Leave</SelectItem>
                                                    <SelectItem value="SPL">Special Privilege Leave</SelectItem>
                                                    <SelectItem value="Forced">Forced Leave</SelectItem>
                                                    <SelectItem value="Maternity">Maternity Leave</SelectItem>
                                                    <SelectItem value="Paternity">Paternity Leave</SelectItem>
                                                    <SelectItem value="Others">Others</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Number of Days */}
                                <FormField
                                    control={form.control}
                                    name="number_of_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase">Working Days Applied For</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.5" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">
                                                Can be half-days (e.g. 0.5)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Conditional Details based on Selection */}
                            <FormField
                                control={form.control}
                                name="details"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase">
                                            {selectedType === 'Vacation' ? 'Where will you spend your leave?' :
                                                selectedType === 'Sick' ? 'Medical Details / Treatment Status' :
                                                    'Details of Leave'}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={
                                                    selectedType === 'Vacation' ? "e.g., Within Philippines (Province), or Abroad (Country)" :
                                                        selectedType === 'Sick' ? "e.g., In Hospital (Name), or Outpatient (Diagnosis)" :
                                                            "Provide specific details as required by Form 6"
                                                }
                                                className="min-h-[100px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Inclusive Dates */}
                                <FormField
                                    control={form.control}
                                    name="inclusive_dates"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase">Inclusive Dates</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. June 10-15, 2026" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Commutation */}
                                <FormField
                                    control={form.control}
                                    name="commutation"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-xs font-bold uppercase">Commutation</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex flex-col space-y-1"
                                                >
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="Not Requested" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-sm">Not Requested</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="Requested" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-sm">Requested</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-4 flex items-start gap-3 p-4 bg-muted/20 rounded-lg text-muted-foreground">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-[11px] leading-relaxed">
                                    By submitting this application, I certify that the information provided is correct and true.
                                    Misrepresentation is punishable under CSC rules and regulations. This application will be
                                    routed for approval by the department head and administrative office.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Processing Application..." : "Submit Leave Application"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
