import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 9
    },
    header: {
        textAlign: 'center',
        marginBottom: 10
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: 10,
        marginBottom: 2
    },

    // Paragraph Block
    paragraph: {
        marginBottom: 10,
        fontSize: 10,
        lineHeight: 1.4,
        textAlign: 'justify'
    },
    signatureLine: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
        marginTop: 10
    },
    signatureText: {
        width: 200,
        textAlign: 'center',
        borderTopWidth: 1,
        paddingTop: 2,
        marginTop: 20
    },

    // Table Structure
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
        minHeight: 20,
        alignItems: 'stretch' // Ensure cells fill height
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableCell: {
        margin: 4,
        fontSize: 8,
        textAlign: 'left'
    },
    tableCellCentered: {
        margin: 4,
        fontSize: 8,
        textAlign: 'center'
    },
    headerCell: {
        margin: 4,
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center'
    },

    // Column Widths (Total 100%)
    colMFO: { width: '20%' },
    colIndicators: { width: '30%' },
    colAccomplishment: { width: '30%' },
    colRatingGroup: { width: '10%' }, // Q, E, T, A (2.5% each or nested)
    colRemarks: { width: '10%' },

    // Footer Signatures
    footer: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    footerBox: {
        width: '23%',
        padding: 5
    },
    footerLabel: {
        fontSize: 8,
        marginBottom: 25 // Space for signature
    },
    footerName: {
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        textDecoration: 'underline'
    },
    footerTitle: {
        fontSize: 8,
        textAlign: 'center'
    },
    footerDate: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 2
    }
})

type Target = {
    mfo: string
    indicators: string
    actual_accomplishment: string
    q: number
    e: number
    t: number
    a: number
    remarks: string
    category: string
}

type IPCRDocumentProps = {
    data: {
        employee: {
            name: string
            position: string
            department: string
            division: string
        }
        supervisor: {
            name: string
            position: string
        }
        head: {
            name: string // Provincial Assessor
        }
        period: string
        targets: Target[]
        final_rating: number
        adjectival_rating: string
    }
}

export const IPCRDocument = ({ data }: IPCRDocumentProps) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW (IPCR)</Text>
            </View>

            <View style={styles.paragraph}>
                <Text>
                    I, <Text style={{ fontWeight: 'bold' }}>{data.employee.name}</Text>, of the {data.employee.division || data.employee.department} Division, commit to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period <Text style={{ fontWeight: 'bold' }}>{data.period}</Text>.
                </Text>
            </View>

            <View style={styles.signatureLine}>
                <View>
                    <Text style={styles.signatureText}>Ratee</Text>
                    <Text style={{ fontSize: 8, textAlign: 'center' }}>Date: _______________</Text>
                </View>
            </View>

            {/* Table Header */}
            <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
                    <View style={[styles.tableCol, styles.colMFO, { justifyContent: 'center' }]}>
                        <Text style={styles.headerCell}>Output</Text>
                    </View>
                    <View style={[styles.tableCol, styles.colIndicators, { justifyContent: 'center' }]}>
                        <Text style={styles.headerCell}>Success Indicators</Text>
                        <Text style={{ fontSize: 7, textAlign: 'center' }}>(Target + Measures)</Text>
                    </View>
                    <View style={[styles.tableCol, styles.colAccomplishment, { justifyContent: 'center' }]}>
                        <Text style={styles.headerCell}>Actual Accomplishments</Text>
                    </View>

                    {/* Nested Rating Columns */}
                    <View style={[styles.tableCol, styles.colRatingGroup]}>
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', padding: 2 }}>
                            <Text style={styles.headerCell}>Rating</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <View style={{ width: '25%', borderRightWidth: 1, justifyContent: 'center' }}><Text style={styles.headerCell}>Q</Text></View>
                            <View style={{ width: '25%', borderRightWidth: 1, justifyContent: 'center' }}><Text style={styles.headerCell}>E</Text></View>
                            <View style={{ width: '25%', borderRightWidth: 1, justifyContent: 'center' }}><Text style={styles.headerCell}>T</Text></View>
                            <View style={{ width: '25%', justifyContent: 'center' }}><Text style={styles.headerCell}>A</Text></View>
                        </View>
                    </View>

                    <View style={[styles.tableCol, styles.colRemarks, { justifyContent: 'center' }]}>
                        <Text style={styles.headerCell}>Remarks</Text>
                    </View>
                </View>

                {/* Table Body - Loop Categories */}
                {['strategic', 'core', 'support'].map(category => {
                    const categoryTargets = data.targets.filter(t => t.category === category)
                    if (categoryTargets.length === 0) return null

                    return (
                        <View key={category}>
                            {/* Category Header Row */}
                            <View style={[styles.tableRow, { backgroundColor: '#e6e6e6' }]}>
                                <View style={[styles.tableCol, { width: '100%' }]}>
                                    <Text style={[styles.tableCell, { fontWeight: 'bold', textTransform: 'uppercase' }]}>
                                        {category === 'strategic' ? 'Strategic Priorities' : category === 'core' ? 'Core Functions' : 'Support Functions'}
                                    </Text>
                                </View>
                            </View>

                            {/* Target Rows */}
                            {categoryTargets.map((target, index) => (
                                <View style={styles.tableRow} key={index} wrap={false}>
                                    <View style={[styles.tableCol, styles.colMFO]}>
                                        <Text style={styles.tableCell}>{target.mfo}</Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.colIndicators]}>
                                        <Text style={styles.tableCell}>{target.indicators}</Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.colAccomplishment]}>
                                        <Text style={styles.tableCell}>{target.actual_accomplishment || ' '}</Text>
                                    </View>

                                    {/* Rating Columns split manually */}
                                    <View style={[styles.tableCol, styles.colRatingGroup, { flexDirection: 'row' }]}>
                                        <View style={{ width: '25%', borderRightWidth: 1, justifyContent: 'center' }}>
                                            <Text style={styles.tableCellCentered}>{target.q || ''}</Text>
                                        </View>
                                        <View style={{ width: '25%', borderRightWidth: 1, justifyContent: 'center' }}>
                                            <Text style={styles.tableCellCentered}>{target.e || ''}</Text>
                                        </View>
                                        <View style={{ width: '25%', borderRightWidth: 1, justifyContent: 'center' }}>
                                            <Text style={styles.tableCellCentered}>{target.t || ''}</Text>
                                        </View>
                                        <View style={{ width: '25%', justifyContent: 'center' }}>
                                            <Text style={[styles.tableCellCentered, { fontWeight: 'bold' }]}>{target.a?.toFixed(2) || ''}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.tableCol, styles.colRemarks]}>
                                        <Text style={styles.tableCell}>{target.remarks || ' '}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )
                })}

                {/* Final Average Row */}
                <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
                    <View style={[styles.tableCol, { width: '80%', alignItems: 'flex-end', paddingRight: 5, justifyContent: 'center' }]}>
                        <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Final Average Rating:</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '10%' }]}>
                        <View style={{ flexDirection: 'row', height: '100%' }}>
                            <View style={{ width: '75%', borderRightWidth: 1, justifyContent: 'center' }}>
                                {/* Padding for QET */}
                            </View>
                            <View style={{ width: '25%', justifyContent: 'center' }}>
                                <Text style={[styles.tableCellCentered, { fontWeight: 'bold' }]}>{data.final_rating?.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={[styles.tableCol, { width: '10%', justifyContent: 'center' }]}>
                        <Text style={[styles.tableCellCentered, { fontSize: 7, fontWeight: 'bold' }]}>{data.adjectival_rating}</Text>
                    </View>
                </View>
            </View>

            {/* Sub-Footer Comments */}
            <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 8 }}>Comments and Recommendations for Development Purposes:</Text>
                <View style={{ height: 40, borderBottomWidth: 1, marginBottom: 5 }} />
                <View style={{ height: 20, borderBottomWidth: 1 }} />
            </View>

            {/* Footer Signatures */}
            <View style={styles.footer}>
                <View style={styles.footerBox}>
                    <Text style={styles.footerLabel}>Discussed with:</Text>
                    <Text style={styles.footerName}>{data.employee.name}</Text>
                    <Text style={styles.footerTitle}>Ratee</Text>
                    <Text style={styles.footerDate}>Date: _______________</Text>
                </View>

                <View style={styles.footerBox}>
                    <Text style={styles.footerLabel}>Assessed by:</Text>
                    <Text style={styles.footerName}>{data.supervisor.name || 'Immediate Supervisor'}</Text>
                    <Text style={styles.footerTitle}>{data.supervisor.position || 'Immediate Supervisor'}</Text>
                    <Text style={styles.footerDate}>Date: _______________</Text>
                </View>

                {/* Optional Reviewer Column if needed, usually Dept Head if distinct from Supervisor */}
                {/* 
                <View style={styles.footerBox}>
                    <Text style={styles.footerLabel}>Reviewed by:</Text>
                    <Text style={styles.footerName}>[Department Head]</Text>
                </View> 
                */}

                <View style={styles.footerBox}>
                    <Text style={styles.footerLabel}>Final Rating by:</Text>
                    <Text style={styles.footerName}>{data.head.name || 'Provincial Assessor'}</Text>
                    <Text style={styles.footerTitle}>Provincial Assessor</Text>
                    <Text style={styles.footerDate}>Date: _______________</Text>
                </View>
            </View>

            {/* Legend */}
            <View style={{ position: 'absolute', bottom: 20, left: 20 }}>
                <Text style={{ fontSize: 7, color: '#666' }}>Legend: 1 - Quantity, 2 - Efficiency, 3 - Timeliness, 4 - Average</Text>
            </View>
        </Page>
    </Document>
)
