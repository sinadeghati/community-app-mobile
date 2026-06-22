import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  combineDateAndTimeToIso,
  defaultEventDate,
  defaultEventTime,
  formatEventDateDisplay,
  formatEventTimeDisplay,
  parseDateText,
  parseTimeParts,
  splitIsoToDateAndTime,
} from "../../lib/eventDateTime";
import { useTranslation } from "../../lib/i18n";

type EventDateTimeFieldsProps = {
  initialIso?: string;
  initialEndIso?: string;
  minimumDate?: Date;
  showEndFields?: boolean;
  onChange: (value: {
    eventDateIso: string | null;
    dateText: string;
    timeText: string;
    endDateIso: string | null;
    endDateText: string;
    endTimeText: string;
  }) => void;
};

const labelStyle = {
  fontSize: 15,
  fontWeight: "700" as const,
  color: "#222",
  marginBottom: 10,
  marginTop: 14,
};

const inputStyle = {
  backgroundColor: "#F8F8F8",
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "#E5E5E5",
  color: "#111",
};

const parseTypedTimeToDate = (timeText: string, baseDate: Date) => {
  const parts = parseTimeParts(timeText);
  if (!parts) return null;

  const time = new Date(baseDate);
  time.setHours(parts.hours, parts.minutes, 0, 0);
  return time;
};

export function EventDateTimeFields({
  initialIso,
  initialEndIso,
  minimumDate,
  showEndFields = true,
  onChange,
}: EventDateTimeFieldsProps) {
  const { t, isRTL } = useTranslation();
  const initial = useMemo(() => {
    if (initialIso) {
      const { date, time } = splitIsoToDateAndTime(initialIso);
      if (date && time) {
        return { date, time };
      }
    }
    return {
      date: defaultEventDate(),
      time: defaultEventTime(),
    };
  }, [initialIso]);

  const initialEnd = useMemo(() => {
    if (initialEndIso) {
      const { date, time } = splitIsoToDateAndTime(initialEndIso);
      if (date && time) {
        return { date, time };
      }
    }
    return null;
  }, [initialEndIso]);

  const [selectedDate, setSelectedDate] = useState<Date>(initial.date);
  const [selectedTime, setSelectedTime] = useState<Date>(initial.time);
  const [dateText, setDateText] = useState(formatEventDateDisplay(initial.date));
  const [timeText, setTimeText] = useState(formatEventTimeDisplay(initial.time));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosDateDraft, setIosDateDraft] = useState<Date>(initial.date);
  const [iosTimeDraft, setIosTimeDraft] = useState<Date>(initial.time);
  const [endDateText, setEndDateText] = useState(
    initialEnd ? formatEventDateDisplay(initialEnd.date) : ""
  );
  const [endTimeText, setEndTimeText] = useState(
    initialEnd ? formatEventTimeDisplay(initialEnd.time) : ""
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    initialEnd?.date ?? null
  );
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(
    initialEnd?.time ?? null
  );
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [iosEndDateDraft, setIosEndDateDraft] = useState<Date>(
    initialEnd?.date ?? initial.date
  );
  const [iosEndTimeDraft, setIosEndTimeDraft] = useState<Date>(
    initialEnd?.time ?? initial.time
  );

  const resolveEndIso = (
    endDate: Date | null,
    endTime: Date | null,
    endDateLabel: string,
    endTimeLabel: string
  ) => {
    if (!endDateLabel.trim() && !endTimeLabel.trim()) {
      return null;
    }
    if (!endDate || !endTime) {
      return null;
    }
    return combineDateAndTimeToIso(endDate, endTime);
  };

  const emitChange = (
    nextDate: Date,
    nextTime: Date,
    nextDateText: string,
    nextTimeText: string,
    nextEndDate: Date | null = selectedEndDate,
    nextEndTime: Date | null = selectedEndTime,
    nextEndDateText: string = endDateText,
    nextEndTimeText: string = endTimeText
  ) => {
    onChange({
      eventDateIso: combineDateAndTimeToIso(nextDate, nextTime),
      dateText: nextDateText,
      timeText: nextTimeText,
      endDateIso: resolveEndIso(
        nextEndDate,
        nextEndTime,
        nextEndDateText,
        nextEndTimeText
      ),
      endDateText: nextEndDateText,
      endTimeText: nextEndTimeText,
    });
  };

  useEffect(() => {
    emitChange(selectedDate, selectedTime, dateText, timeText);
    // Emit initial values once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyDate = (date: Date, closePicker = true) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const nextDateText = formatEventDateDisplay(normalized);
    setSelectedDate(normalized);
    setDateText(nextDateText);
    emitChange(normalized, selectedTime, nextDateText, timeText);
    if (closePicker) setShowDatePicker(false);
  };

  const applyTime = (time: Date, closePicker = true) => {
    const nextTime = new Date(selectedDate);
    nextTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
    const nextTimeText = formatEventTimeDisplay(nextTime);
    setSelectedTime(nextTime);
    setTimeText(nextTimeText);
    emitChange(selectedDate, nextTime, dateText, nextTimeText);
    if (closePicker) setShowTimePicker(false);
  };

  const openDatePicker = () => {
    setShowTimePicker(false);
    setIosDateDraft(selectedDate);
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setShowDatePicker(false);
    setIosTimeDraft(selectedTime);
    setShowTimePicker(true);
  };

  const confirmIosDatePicker = () => {
    applyDate(iosDateDraft, true);
  };

  const confirmIosTimePicker = () => {
    applyTime(iosTimeDraft, true);
  };

  const onDatePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    if (!date) return;

    if (Platform.OS === "ios") {
      setIosDateDraft(date);
      return;
    }

    applyDate(date, true);
  };

  const onTimePickerChange = (event: DateTimePickerEvent, time?: Date) => {
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }
    if (!time) return;

    if (Platform.OS === "ios") {
      setIosTimeDraft(time);
      return;
    }

    applyTime(time, true);
  };

  const onDateTextBlur = () => {
    const parsed = parseDateText(dateText);
    if (parsed) {
      applyDate(parsed, false);
      return;
    }
    setDateText(formatEventDateDisplay(selectedDate));
  };

  const onTimeTextBlur = () => {
    const parsed = parseTypedTimeToDate(timeText, selectedDate);
    if (parsed) {
      applyTime(parsed, false);
      return;
    }
    setTimeText(formatEventTimeDisplay(selectedTime));
  };

  const applyEndDate = (date: Date, closePicker = true) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const nextEndDateText = formatEventDateDisplay(normalized);
    const nextEndTime = selectedEndTime ?? new Date(selectedTime);
    setSelectedEndDate(normalized);
    setEndDateText(nextEndDateText);
    if (!selectedEndTime) {
      setSelectedEndTime(nextEndTime);
      setEndTimeText(formatEventTimeDisplay(nextEndTime));
    }
    emitChange(
      selectedDate,
      selectedTime,
      dateText,
      timeText,
      normalized,
      selectedEndTime ?? nextEndTime,
      nextEndDateText,
      selectedEndTime ? endTimeText : formatEventTimeDisplay(nextEndTime)
    );
    if (closePicker) setShowEndDatePicker(false);
  };

  const applyEndTime = (time: Date, closePicker = true) => {
    const baseDate = selectedEndDate ?? selectedDate;
    const nextEnd = new Date(baseDate);
    nextEnd.setHours(time.getHours(), time.getMinutes(), 0, 0);
    const nextEndTimeText = formatEventTimeDisplay(nextEnd);
    if (!selectedEndDate) {
      setSelectedEndDate(baseDate);
      setEndDateText(formatEventDateDisplay(baseDate));
    }
    setSelectedEndTime(nextEnd);
    setEndTimeText(nextEndTimeText);
    emitChange(
      selectedDate,
      selectedTime,
      dateText,
      timeText,
      selectedEndDate ?? baseDate,
      nextEnd,
      selectedEndDate ? endDateText : formatEventDateDisplay(baseDate),
      nextEndTimeText
    );
    if (closePicker) setShowEndTimePicker(false);
  };

  const clearEndSchedule = () => {
    setSelectedEndDate(null);
    setSelectedEndTime(null);
    setEndDateText("");
    setEndTimeText("");
    emitChange(selectedDate, selectedTime, dateText, timeText, null, null, "", "");
  };

  const iosDoneButtonStyle = {
    marginTop: 8,
    alignSelf: "flex-end" as const,
    paddingHorizontal: 14,
    paddingVertical: 8,
  };

  return (
    <View>
      <Text style={[labelStyle, { textAlign: isRTL ? "right" : "left" }]}>{t("event.startDate")}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={dateText}
          onChangeText={setDateText}
          onBlur={onDateTextBlur}
          placeholder="June 10, 2026"
          placeholderTextColor="#999"
          style={[inputStyle, { flex: 1 }]}
        />
        <Pressable
          onPress={openDatePicker}
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            backgroundColor: "#E6F5F3",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#CFE9E4",
          }}
        >
          <Ionicons name="calendar-outline" size={22} color="#11998E" />
        </Pressable>
      </View>

      {showDatePicker ? (
        <>
          <DateTimePicker
            value={Platform.OS === "ios" ? iosDateDraft : selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={minimumDate}
            onChange={onDatePickerChange}
          />
          {Platform.OS === "ios" ? (
            <Pressable onPress={confirmIosDatePicker} style={iosDoneButtonStyle}>
              <Text style={{ color: "#11998E", fontWeight: "800" }}>{t("common.done")}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <Text style={[labelStyle, { textAlign: isRTL ? "right" : "left" }]}>{t("event.startTime")}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={timeText}
          onChangeText={setTimeText}
          onBlur={onTimeTextBlur}
          placeholder="7:00 AM"
          placeholderTextColor="#999"
          style={[inputStyle, { flex: 1 }]}
        />
        <Pressable
          onPress={openTimePicker}
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            backgroundColor: "#E6F5F3",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#CFE9E4",
          }}
        >
          <Ionicons name="time-outline" size={22} color="#11998E" />
        </Pressable>
      </View>

      {showTimePicker ? (
        <>
          <DateTimePicker
            value={Platform.OS === "ios" ? iosTimeDraft : selectedTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onTimePickerChange}
          />
          {Platform.OS === "ios" ? (
            <Pressable onPress={confirmIosTimePicker} style={iosDoneButtonStyle}>
              <Text style={{ color: "#11998E", fontWeight: "800" }}>{t("common.done")}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {showEndFields ? (
        <>
          <Text style={[labelStyle, { textAlign: isRTL ? "right" : "left" }]}>{t("event.endDate")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={endDateText}
              onChangeText={(text) => {
                setEndDateText(text);
                if (!text.trim()) {
                  clearEndSchedule();
                }
              }}
              onBlur={() => {
                const parsed = parseDateText(endDateText);
                if (parsed) {
                  applyEndDate(parsed, false);
                  return;
                }
                if (!endDateText.trim()) {
                  clearEndSchedule();
                  return;
                }
                if (selectedEndDate) {
                  setEndDateText(formatEventDateDisplay(selectedEndDate));
                }
              }}
              placeholder="June 10, 2026"
              placeholderTextColor="#999"
              style={[inputStyle, { flex: 1 }]}
            />
            <Pressable
              onPress={() => {
                setShowEndTimePicker(false);
                setIosEndDateDraft(selectedEndDate ?? selectedDate);
                setShowEndDatePicker(true);
              }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: "#E6F5F3",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#CFE9E4",
              }}
            >
              <Ionicons name="calendar-outline" size={22} color="#11998E" />
            </Pressable>
          </View>

          {showEndDatePicker ? (
            <>
              <DateTimePicker
                value={Platform.OS === "ios" ? iosEndDateDraft : selectedEndDate ?? selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={minimumDate}
                onChange={(event, date) => {
                  if (event.type === "dismissed") {
                    setShowEndDatePicker(false);
                    return;
                  }
                  if (!date) return;
                  if (Platform.OS === "ios") {
                    setIosEndDateDraft(date);
                    return;
                  }
                  applyEndDate(date, true);
                }}
              />
              {Platform.OS === "ios" ? (
                <Pressable
                  onPress={() => applyEndDate(iosEndDateDraft, true)}
                  style={iosDoneButtonStyle}
                >
                  <Text style={{ color: "#11998E", fontWeight: "800" }}>{t("common.done")}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          <Text style={[labelStyle, { textAlign: isRTL ? "right" : "left" }]}>{t("event.endTime")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={endTimeText}
              onChangeText={(text) => {
                setEndTimeText(text);
                if (!text.trim() && !endDateText.trim()) {
                  clearEndSchedule();
                }
              }}
              onBlur={() => {
                const parsed = parseTypedTimeToDate(
                  endTimeText,
                  selectedEndDate ?? selectedDate
                );
                if (parsed) {
                  applyEndTime(parsed, false);
                  return;
                }
                if (!endTimeText.trim()) {
                  if (!endDateText.trim()) clearEndSchedule();
                  return;
                }
                if (selectedEndTime) {
                  setEndTimeText(formatEventTimeDisplay(selectedEndTime));
                }
              }}
              placeholder="10:00 PM"
              placeholderTextColor="#999"
              style={[inputStyle, { flex: 1 }]}
            />
            <Pressable
              onPress={() => {
                setShowEndDatePicker(false);
                setIosEndTimeDraft(selectedEndTime ?? selectedTime);
                setShowEndTimePicker(true);
              }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: "#E6F5F3",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#CFE9E4",
              }}
            >
              <Ionicons name="time-outline" size={22} color="#11998E" />
            </Pressable>
          </View>

          {showEndTimePicker ? (
            <>
              <DateTimePicker
                value={Platform.OS === "ios" ? iosEndTimeDraft : selectedEndTime ?? selectedTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, time) => {
                  if (event.type === "dismissed") {
                    setShowEndTimePicker(false);
                    return;
                  }
                  if (!time) return;
                  if (Platform.OS === "ios") {
                    setIosEndTimeDraft(time);
                    return;
                  }
                  applyEndTime(time, true);
                }}
              />
              {Platform.OS === "ios" ? (
                <Pressable
                  onPress={() => applyEndTime(iosEndTimeDraft, true)}
                  style={iosDoneButtonStyle}
                >
                  <Text style={{ color: "#11998E", fontWeight: "800" }}>{t("common.done")}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
