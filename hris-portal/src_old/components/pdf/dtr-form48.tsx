'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'
import { formatTime12h } from '@/lib/utils'

const styles = StyleSheet.create({
    // ... rest of styles
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        marginBottom: 10,
        textAlign: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        textDecoration: 'underline',
        marginBottom: 10,
    },
    formNo: {
        position: 'absolute',
        top: 20,
        left: 40,
        fontSize: 8,
    },
    employeeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'solid',
        paddingBottom: 5,
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#000',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000',
    },
    tableHeader: {
        backgroundColor: '#f6f6f6',
        fontWeight: 'bold',
        fontSize: 8,
        textAlign: 'center',
    },
    cellDay: { width: '10%', borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: '#000', padding: 2, textAlign: 'center' },
    cellTime: { width: '18%', borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: '#000', padding: 2, textAlign: 'center' },
    cellUndertime: { width: '18%', padding: 2, textAlign: 'center' },

    footer: {
        marginTop: 20,
    },
    certification: {
        fontSize: 9,
        lineHeight: 1.4,
        textAlign: 'justify',
        marginBottom: 20,
    },
    signatureBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    signatureLine: {
        width: '45%',
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: '#000',
        textAlign: 'center',
        paddingTop: 5,
        fontSize: 9,
    }
})

export const DTRForm48 = ({
    profile,
    month,
    year,
    logs
}: {
    profile: any,
    month: string,
    year: string,
    logs: any[]
}) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.formNo}>Civil Service Form No. 48</Text>

                <View style={styles.header}>
                    <Text style={styles.title}>DAILY TIME RECORD</Text>
                    <Text>-----o0o-----</Text>
                </View>

                <View style={styles.employeeInfo}>
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{profile?.full_name?.toUpperCase()}</Text>
                        <Text style={{ fontSize: 8, color: '#666' }}>Name (Print)</Text>
                    </View>
                    <View style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 10 }}>For the month of: <Text style={{ fontWeight: 'bold' }}>{month} {year}</Text></Text>
                    </View>
                </View>

                <View style={styles.table}>
                    {/* Main Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={styles.cellDay}><Text>Day</Text></View>
                        <View style={{ width: '36%', borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: '#000' }}><Text>A.M.</Text></View>
                        <View style={{ width: '36%', borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: '#000' }}><Text>P.M.</Text></View>
                        <View style={styles.cellUndertime}><Text>Undertime</Text></View>
                    </View>

                    {/* Sub Header */}
                    <View style={[styles.tableRow, styles.tableHeader, { fontSize: 7 }]}>
                        <View style={styles.cellDay}><Text></Text></View>
                        <View style={styles.cellTime}><Text>Arrival</Text></View>
                        <View style={styles.cellTime}><Text>Departure</Text></View>
                        <View style={styles.cellTime}><Text>Arrival</Text></View>
                        <View style={styles.cellTime}><Text>Departure</Text></View>
                        <View style={styles.cellUndertime}><Text></Text></View>
                    </View>

                    {/* Data Rows */}
                    {logs.map((day) => {
                        const isNonRegular = day.logs?.status && day.logs?.status !== "Regular"

                        return (
                            <View key={day.date} style={styles.tableRow}>
                                <View style={styles.cellDay}><Text>{day.day}</Text></View>
                                {isNonRegular ? (
                                    <View style={{ width: '72%', borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: '#000', padding: 2, textAlign: 'center' }}>
                                        <Text style={{ fontWeight: 'bold' }}>{day.logs.status.toUpperCase()}</Text>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.cellTime}><Text>{formatTime12h(day.logs?.am_in, false)}</Text></View>
                                        <View style={styles.cellTime}><Text>{formatTime12h(day.logs?.am_out, false)}</Text></View>
                                        <View style={styles.cellTime}><Text>{formatTime12h(day.logs?.pm_in, false)}</Text></View>
                                        <View style={styles.cellTime}><Text>{formatTime12h(day.logs?.pm_out, false)}</Text></View>
                                    </>
                                )}
                                <View style={styles.cellUndertime}><Text></Text></View>
                            </View>
                        )
                    })}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.certification}>
                        I certify on my honor that the above is a true and correct report of the attendance or service of the
                        above-named person, made by himself/herself daily at the time of arrival and departure from office.
                    </Text>

                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine}>
                            <Text style={{ fontWeight: 'bold' }}>{profile?.full_name}</Text>
                            <Text style={{ fontSize: 8 }}>Ratee</Text>
                        </View>
                        <View style={styles.signatureLine}>
                            <Text style={{ fontSize: 8 }}>Verified as to the prescribed office hours:</Text>
                            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>ENGR. CARL PACPACO</Text>
                            <Text style={{ fontSize: 8 }}>Provincial Assessor / Supervisor</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
