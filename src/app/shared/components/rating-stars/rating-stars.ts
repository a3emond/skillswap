import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  templateUrl: './rating-stars.html',
  styleUrl: './rating-stars.scss'
})
export class RatingStars {

  @Input() rating = 0;

  stars = [1, 2, 3, 4, 5];

}