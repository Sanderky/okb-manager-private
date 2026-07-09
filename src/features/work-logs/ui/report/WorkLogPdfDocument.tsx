import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { formatDecimal } from '@/shared/lib/format';
import type { ConstructionsWithWorkHours, TableData } from '../../model/types';
import type { LangCode } from '@/shared/config/i18n/languages';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto.ttf', fontWeight: 400 },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    fontSize: 7,
    fontFamily: 'Roboto',
  },
  mainTitle: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 700,
    marginBottom: 4,
  },
  subTitle: { fontSize: 9, textAlign: 'center', marginBottom: 15 },
  weekTitle: {
    fontSize: 8,
    marginBottom: 4,
    textAlign: 'left',
    fontWeight: 700,
  },
  noData: { fontSize: 8, marginTop: 5 },

  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },

  table: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    minHeight: 16,
  },

  colConstruction: {
    width: '21%',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#000',
  },
  colEmployee: { width: '22%', borderRightWidth: 1, borderColor: '#000' },
  colDay: { width: '7%', borderRightWidth: 1, borderColor: '#000' },
  colSum: { width: '8%', borderRightWidth: 1, borderColor: '#000' },

  headerCell: {
    borderTopWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataCell: {
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },

  dataCellConstruction: {
    borderBottomWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  summaryCellEmpty: {
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  summaryTotalCell: {
    borderBottomWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },

  footerRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingLeft: 4,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
  },

  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  textBold: { fontWeight: 700 },
  textDayName: {
    fontSize: 6,
    fontWeight: 700,
    marginBottom: 1,
    textAlign: 'center',
  },
  textDayDate: { fontSize: 7, fontWeight: 700, textAlign: 'center' },
});

interface WorkLogPdfDocumentProps {
  weeksData: TableData[];
  lang: LangCode;
  showVacation: boolean;
  omitEmpty: boolean;
  printTitle: boolean;
  printTablesTitle: boolean;
  labels: {
    title?: string;
    subtitle?: string;
    weekTitle: string;
    construction: string;
    employee: string;
    sum: string;
    vacation: string;
    noData: string;
    constructionsCount: (count: number) => string;
    employeesCount: (count: number) => string;
    totalSum: string;
  };
}

export const WorkLogPdfDocument: React.FC<WorkLogPdfDocumentProps> = ({
  weeksData,
  lang,
  showVacation,
  omitEmpty,
  printTitle,
  printTablesTitle,
  labels,
}) => {
  const shortLang = lang.substring(0, 2).toLowerCase();

  // const firstRenderedWeekIndex = weeksData.findIndex(
  //   (w) => !omitEmpty || w.constructionsWithWorkHours.length > 0
  // );

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />

        {printTitle && labels.title && labels.subtitle && (
          <View>
            <Text style={styles.mainTitle}>{labels.title}</Text>
            <Text style={styles.subTitle}>{labels.subtitle}</Text>
          </View>
        )}

        {weeksData.map((weekData, weekIndex) => {
          if (omitEmpty && weekData.constructionsWithWorkHours.length === 0)
            return null;

          const title = `${weekIndex > 0 || printTitle ? `${weekIndex + 1}) ` : ''}${labels.weekTitle} ${dayjs(weekData.weekStart).isoWeek()}: ${dayjs(weekData.weekDates[0]).format('DD.MM.YYYY')} - ${dayjs(weekData.weekDates[6]).format('DD.MM.YYYY')}`;

          const employeesCount = weekData.constructionsWithWorkHours.reduce(
            (acc: number, c: ConstructionsWithWorkHours) =>
              acc + c.workHours.length,
            0
          );

          return (
            <View key={weekIndex} style={{ marginBottom: 25 }}>
              {printTablesTitle && (
                <Text style={styles.weekTitle}>{title}</Text>
              )}

              {weekData.constructionsWithWorkHours.length === 0 ? (
                <Text style={styles.noData}>{labels.noData}</Text>
              ) : (
                <>
                  <View style={styles.table}>
                    <View style={styles.row} wrap={false} fixed>
                      <View style={[styles.colConstruction, styles.headerCell]}>
                        <Text style={styles.textBold}>
                          {labels.construction}
                        </Text>
                      </View>
                      <View style={[styles.colEmployee, styles.headerCell]}>
                        <Text style={styles.textBold}>{labels.employee}</Text>
                      </View>
                      {weekData.weekDates.map((date: Date, idx: number) => (
                        <View
                          style={[styles.colDay, styles.headerCell]}
                          key={idx}
                        >
                          <Text style={styles.textDayName}>
                            {dayjs(date).locale(shortLang).format('ddd')}
                          </Text>
                          <Text style={styles.textDayDate}>
                            {dayjs(date).format('DD.MM')}
                          </Text>
                        </View>
                      ))}
                      <View style={[styles.colSum, styles.headerCell]}>
                        <Text style={styles.textBold}>{labels.sum}</Text>
                      </View>
                    </View>

                    {weekData.constructionsWithWorkHours.map(
                      (construction: ConstructionsWithWorkHours) => (
                        <View key={construction.id} wrap={false}>
                          {construction.workHours.map((workHour, empIdx) => (
                            <View
                              style={styles.row}
                              key={workHour.id}
                              wrap={false}
                            >
                              <View
                                style={[
                                  styles.colConstruction,
                                  styles.dataCellConstruction,
                                ]}
                              >
                                <Text style={styles.textBold}>
                                  {empIdx === 0 ? construction.name : ''}
                                </Text>
                              </View>

                              <View
                                style={[styles.colEmployee, styles.dataCell]}
                              >
                                <Text style={styles.textBold}>
                                  {workHour.employeeName}
                                </Text>
                              </View>

                              {workHour.hours.map((hour, dayIdx) => {
                                const isVacation =
                                  workHour.isOnVacation[dayIdx];
                                let content = null;
                                if (isVacation && showVacation)
                                  content = labels.vacation;
                                else if (hour !== null && hour !== undefined)
                                  content = formatDecimal(hour, lang);

                                return (
                                  <View
                                    style={[styles.colDay, styles.dataCell]}
                                    key={dayIdx}
                                  >
                                    <Text style={styles.textCenter}>
                                      {content}
                                    </Text>
                                  </View>
                                );
                              })}

                              <View style={[styles.colSum, styles.dataCell]}>
                                <Text
                                  style={[styles.textCenter, styles.textBold]}
                                >
                                  {formatDecimal(workHour.total, lang)}
                                </Text>
                              </View>
                            </View>
                          ))}

                          <View style={styles.row} wrap={false}>
                            <View
                              style={[
                                styles.colConstruction,
                                styles.summaryCellEmpty,
                              ]}
                            />
                            <View
                              style={[
                                { width: '71%' },
                                styles.summaryCellEmpty,
                              ]}
                            />
                            <View
                              style={[styles.colSum, styles.summaryTotalCell]}
                            >
                              <Text style={styles.textBold}>
                                {formatDecimal(construction.totalHours, lang)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )
                    )}
                  </View>
                  <View style={styles.footerRow} wrap={false}>
                    <View style={{ width: '21%' }}>
                      <Text>
                        {labels.constructionsCount(
                          weekData.constructionsWithWorkHours.length
                        )}
                      </Text>
                    </View>
                    <View style={{ width: '22%' }}>
                      <Text>{labels.employeesCount(employeesCount)}</Text>
                    </View>
                    <View style={{ width: '49%' }}>
                      <Text style={styles.textRight}>{labels.totalSum}:</Text>
                    </View>
                    <View style={{ width: '8%' }}>
                      <Text style={styles.textCenter}>
                        {formatDecimal(
                          weekData.totalHoursData.grandTotal,
                          lang
                        )}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};
