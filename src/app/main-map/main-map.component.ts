import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
declare var google;

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.css']
})
export class MainMapComponent implements OnInit {

  @ViewChild('map') mapElement: ElementRef;
  map: any;

  constructor() { }

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
      mapTypeId: 'satellite'
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

    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

    // Manda los resultados del cuadro de búsqueda hacia la ventana de mapas actual
    this.map.addListener('bounds_changed', () => {
      searchBox.setBounds(this.map.getBounds());
    });

    var markers = [];
    // Escucha el evento cuando el usuario selleciona una preeresultado y da un poco de info
    searchBox.addListener('places_changed', () => {
      var places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }
      // Limpia los marcadores pasados
      markers.forEach((marker) => {
        marker.setMap(null);
      });
      markers = [];

      //Obtiene el icono y nombre de la localización
      var bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        //Crea un marcador por cada lugar
        markers.push(new google.maps.Marker({
          map: this.map,
          icon: icon,
          title: place.name,
          position: place.geometry.location
        }));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      this.map.fitBounds(bounds);
    }); 


  }

}
