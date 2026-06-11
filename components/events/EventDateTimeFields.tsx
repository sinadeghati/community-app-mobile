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

type EventDateTimeFieldsProps = {
  initialIso?: string;
  minimumDate?: Date;
  onChange: (value: {
    eventDateIso: string | null;
    dateText: string;
    timeText: string;
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
  minimumDate,
  onChange,
}: EventDateTimeFieldsProps) {
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

  const [selectedDate, setSelectedDate] = useState<Date>(initial.date);
  const [selectedTime, setSelectedTime] = useState<Date>(initial.time);
  const [dateText, setDateText] = useState(formatEventDateDisplay(initial.date));
  const [timeText, setTimeText] = useState(formatEventTimeDisplay(initial.time));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosDateDraft, setIosDateDraft] = useState<Date>(initial.date);
  const [iosTimeDraft, setIosTimeDraft] = useState<Date>(initial.time);

  const emitChange = (
    nextDate: Date,
    nextTime: Date,
    nextDateText: string,
    nextTimeText: string
  ) => {
    onChange({
      eventDateIso: combineDateAndTimeToIso(nextDate, nextTime),
      dateText: nextDateText,
      timeText: nextTimeText,
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

  const iosDoneButtonStyle = {
    marginTop: 8,
    alignSelf: "flex-end" as const,
    paddingHorizontal: 14,
    paddingVertical: 8,
  };

  return (
    <View>
      <Text style={labelStyle}>Date</Text>
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
              <Text style={{ color: "#11998E", fontWeight: "800" }}>Done</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <Text style={labelStyle}>Time</Text>
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
              <Text style={{ color: "#11998E", fontWeight: "800" }}>Done</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
