import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MapsLibService } from '../services/maps-lib/maps-lib.service';
import { LatLng } from '../commons/latlng';
declare var google;

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.css']
})
export class MainMapComponent implements OnInit {

  @ViewChild('map') mapElement: ElementRef;
  map: any;
  

  constructor(
    private mapsLib: MapsLibService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.loadMap();
    }, 1000);
  }

  loadMap() {
    var durango = { lat: 24.028596212016996, lng: -104.66319203292852 };

    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 24.018495, lng: -104.5480484 },
      zoom: 16,
      mapTypeId: 'hybrid',
    });

    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER,

        drawingModes: ['rectangle', 'polyline', 'polygon']
      },
      markerOptions: { icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png' },

    });
    drawingManager.setMap(this.map);

    this.mapsLib.useSearchBox(this.map, 'pac-input');

    google.maps.event.addListener(drawingManager, 'rectanglecomplete', (poly) => {
      this.mapsLib.drawRectangleRoute(this.map, poly);
    });


  }

}
