// src/modules/shared-kernel/domain/Result.ts
export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error: string | null;
  private _value: T | null;

  private constructor(isSuccess: boolean, error: string | null, value: T | null) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value of a failure result.');
    }
    return this._value!;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value || null);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error, null);
  }
}
