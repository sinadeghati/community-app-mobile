import type { Region } from "react-native-maps";

const REGION_SIMILARITY_EPSILON = 0.00001;

export const regionsAreSimilar = (a: Region, b: Region): boolean =>
  Math.abs(a.latitude - b.latitude) < REGION_SIMILARITY_EPSILON &&
  Math.abs(a.longitude - b.longitude) < REGION_SIMILARITY_EPSILON &&
  Math.abs(a.latitudeDelta - b.latitudeDelta) < REGION_SIMILARITY_EPSILON &&
  Math.abs(a.longitudeDelta - b.longitudeDelta) < REGION_SIMILARITY_EPSILON;

/** Caller must pass an already-clamped region. */
export const syncMapRegionState = (prev: Region, next: Region): Region =>
  regionsAreSimilar(prev, next) ? prev : next;
