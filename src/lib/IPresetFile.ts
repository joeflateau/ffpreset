export interface IPresetFile {
  vars?: Record<string, string>;
  args: DeepArray<string>[];
}

type DeepArray<T> = T | DeepArray<T>[];
