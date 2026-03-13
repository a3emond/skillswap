import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scientific',
  standalone: true,
})
export class ScientificPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 2): string {
    if (value == null || value === 0) {
      return '0';
    }

    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exponent);

    return `${mantissa.toFixed(digits)} × 10^${exponent}`;
  }
}
