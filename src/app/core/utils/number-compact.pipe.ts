import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'numberCompact',
  standalone: true
})
export class NumberCompactPipe implements PipeTransform {

  private formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  })

  transform(value: number | null | undefined): string {

    if (value == null) return '0'

    return this.formatter.format(value)

  }

}