import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imageName'
})
export class ImageNamePipe implements PipeTransform {

  transform(value: String): unknown {
    if(value == value.toUpperCase()){
      return `w${value.toUpperCase()}`
    }
    return `b${value.toUpperCase()}`;
  }

}
