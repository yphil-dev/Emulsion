const carousel = document.querySelector('.carousel');
 const cells = carousel.querySelectorAll('.carousel__cell');
 const cellsRange = document.querySelector('.cells-range');
 const prevButton = document.querySelector('.previous-button');
 const nextButton = document.querySelector('.next-button');
 const orientationRadios = document.querySelectorAll('input[name="orientation"]');

 let cellCount;
 let selectedIndex = 0;
 let isHorizontal = true;
 let rotateFn = isHorizontal ? 'rotateY' : 'rotateX';
 let radius, theta;
 let cellWidth = carousel.offsetWidth;
 let cellHeight = carousel.offsetHeight;

 function rotateCarousel() {
   const angle = theta * selectedIndex * -1;
   carousel.style.transform = `translateZ(${-radius}px) ${rotateFn}(${angle}deg)`;
 }

 function changeCarousel() {
   cellCount = cellsRange.value;
   theta = 360 / cellCount;
   const cellSize = isHorizontal ? cellWidth : cellHeight;
   radius = Math.round((cellSize / 2) / Math.tan(Math.PI / cellCount));
   for (let i = 0; i < cells.length; i++) {
     const cell = cells[i];
     if (i < cellCount) {
       cell.style.opacity = 1;
       const cellAngle = theta * i;
       cell.style.transform = `${rotateFn}(${cellAngle}deg) translateZ(${radius}px)`;
     } else {
       cell.style.opacity = 0;
       cell.style.transform = 'none';
     }
   }
   rotateCarousel();
 }

 function onOrientationChange() {
   const checkedRadio = document.querySelector('input[name="orientation"]:checked');
   isHorizontal = checkedRadio.value === 'horizontal';
   rotateFn = isHorizontal ? 'rotateY' : 'rotateX';
   changeCarousel();
 }

 prevButton.addEventListener('click', () => {
   selectedIndex--;
   rotateCarousel();
 });

 nextButton.addEventListener('click', () => {
   selectedIndex++;
   rotateCarousel();
 });

 cellsRange.addEventListener('input', changeCarousel);
 orientationRadios.forEach(radio => radio.addEventListener('change', onOrientationChange));

 onOrientationChange();
