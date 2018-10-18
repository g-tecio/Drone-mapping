import { Injectable } from '@angular/core';
import { LatLng } from 'src/app/commons/latlng';
declare var google;

@Injectable({
  providedIn: 'root'
})
export class MapsLibService {

  cardinalPoints: any = {
    north: 0,
    east: 90,
    south: 180,
    west: 270
  }

  constructor(

  ) {

  }

  getDistanceBetweenPoints(start, end, units = 'km') {

    let earthRadius = {
      miles: 3958.8,
      km: 6371
    };

    var R = earthRadius[units || 'km'];
    var lat1 = start.lat;
    var lon1 = start.lng;
    var lat2 = end.lat;
    var lon2 = end.lng;

    var dLat = this.toRadians((lat2 - lat1));
    var dLon = this.toRadians((lon2 - lon1));
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d;
  }

  distanceOfRoute(route) {

    let result = {
      miles: 0,
      km: 0
    }
    for (let i = 0; i < route.length - 1; i++) {
      result.km = result.km + this.getDistanceBetweenPoints(route[i], route[i + 1], "km");
      result.miles = result.miles + this.getDistanceBetweenPoints(route[i], route[i + 1], "miles");
    }
    return result;
  }

  traceDestinationPoint(start, distance, bearing, radius = 6371e3) {

    var δ = Number(distance) / radius;
    var φ1 = this.toRadians(start.lat), λ1 = this.toRadians(start.lng);
    var θ = this.toRadians(Number(bearing));

    var Δφ = δ * Math.cos(θ);
    var φ2 = φ1 + Δφ;

    if (Math.abs(φ2) > Math.PI / 2) φ2 = φ2 > 0 ? Math.PI - φ2 : -Math.PI - φ2;

    var Δψ = Math.log(Math.tan(φ2 / 2 + Math.PI / 4) / Math.tan(φ1 / 2 + Math.PI / 4));
    var q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1);

    var Δλ = δ * Math.sin(θ) / q;
    var λ2 = λ1 + Δλ;

    return ({ lat: this.toDegrees(φ2), lng: (this.toDegrees(λ2) + 540) % 360 - 180 })

  }

  areaOf(polygon, radius = 6371e3) {
    // uses method due to Karney: osgeo-org.1560.x6.nabble.com/Area-of-a-spherical-polygon-td3841625.html;
    // for each edge of the polygon, tan(E/2) = tan(Δλ/2)·(tan(φ1/2) + tan(φ2/2)) / (1 + tan(φ1/2)·tan(φ2/2))
    // where E is the spherical excess of the trapezium obtained by extending the edge to the equator

    var R = radius;

    // close polygon so that last point equals first point
    var closed = polygon[0].equals(polygon[polygon.length - 1]);
    if (!closed) polygon.push(polygon[0]);

    var nVertices = polygon.length - 1;

    var S = 0; // spherical excess in steradians
    for (var v = 0; v < nVertices; v++) {
      var φ1 = this.toRadians(polygon[v].lat);
      var φ2 = this.toRadians(polygon[v + 1].lat);
      var Δλ = this.toRadians((polygon[v + 1].lng - polygon[v].lng));
      var E = 2 * Math.atan2(Math.tan(Δλ / 2) * (Math.tan(φ1 / 2) + Math.tan(φ2 / 2)), 1 + Math.tan(φ1 / 2) * Math.tan(φ2 / 2));
      S += E;
    }

    if (isPoleEnclosedBy(polygon)) S = Math.abs(S) - 2 * Math.PI;

    var A = Math.abs(S * R * R); // area in units of R

    if (!closed) polygon.pop(); // restore polygon to pristine condition

    return A;

    // returns whether polygon encloses pole: sum of course deltas around pole is 0° rather than
    // normal ±360°: blog.element84.com/determining-if-a-spherical-polygon-contains-a-pole.html
    function isPoleEnclosedBy(polygon) {
      // TODO: any better test than this?
      var ΣΔ = 0;
      var prevBrng = polygon[0].bearingTo(polygon[1]);
      for (var v = 0; v < polygon.length - 1; v++) {
        var initBrng = polygon[v].bearingTo(polygon[v + 1]);
        var finalBrng = polygon[v].finalBearingTo(polygon[v + 1]);
        ΣΔ += (initBrng - prevBrng + 540) % 360 - 180;
        ΣΔ += (finalBrng - initBrng + 540) % 360 - 180;
        prevBrng = finalBrng;
      }
      var initBrng = polygon[0].bearingTo(polygon[1]);
      ΣΔ += (initBrng - prevBrng + 540) % 360 - 180;

      var enclosed = Math.abs(ΣΔ) < 90; // 0°-ish

      return enclosed;

    }
  };

  intersection(p1, brng1, p2, brng2) {
    if (!(p1 instanceof LatLng)) throw new TypeError('p1 is not LatLng object');
    if (!(p2 instanceof LatLng)) throw new TypeError('p2 is not LatLng object');

    // see www.edwilliams.org/avform.htm#Intersection

    var φ1 = this.toRadians(p1.lat), λ1 = this.toRadians(p1.lng);
    var φ2 = this.toRadians(p2.lat), λ2 = this.toRadians(p2.lng);
    var θ13 = this.toRadians(Number(brng1)), θ23 = this.toRadians(Number(brng2));
    var Δφ = φ2 - φ1, Δλ = λ2 - λ1;

    // angular distance p1-p2
    var δ12 = 2 * Math.asin(Math.sqrt(Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
      + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)));
    if (δ12 == 0) return null;

    // initial/final bearings between points
    var θa = Math.acos((Math.sin(φ2) - Math.sin(φ1) * Math.cos(δ12)) / (Math.sin(δ12) * Math.cos(φ1)));
    if (isNaN(θa)) θa = 0; // protect against rounding
    var θb = Math.acos((Math.sin(φ1) - Math.sin(φ2) * Math.cos(δ12)) / (Math.sin(δ12) * Math.cos(φ2)));

    var θ12 = Math.sin(λ2 - λ1) > 0 ? θa : 2 * Math.PI - θa;
    var θ21 = Math.sin(λ2 - λ1) > 0 ? 2 * Math.PI - θb : θb;

    var α1 = θ13 - θ12; // angle 2-1-3
    var α2 = θ21 - θ23; // angle 1-2-3

    if (Math.sin(α1) == 0 && Math.sin(α2) == 0) return null; // infinite intersections
    if (Math.sin(α1) * Math.sin(α2) < 0) return null;      // ambiguous intersection

    var α3 = Math.acos(-Math.cos(α1) * Math.cos(α2) + Math.sin(α1) * Math.sin(α2) * Math.cos(δ12));
    var δ13 = Math.atan2(Math.sin(δ12) * Math.sin(α1) * Math.sin(α2), Math.cos(α2) + Math.cos(α1) * Math.cos(α3));
    var φ3 = Math.asin(Math.sin(φ1) * Math.cos(δ13) + Math.cos(φ1) * Math.sin(δ13) * Math.cos(θ13));
    var Δλ13 = Math.atan2(Math.sin(θ13) * Math.sin(δ13) * Math.cos(φ1), Math.cos(δ13) - Math.sin(φ1) * Math.sin(φ3));
    var λ3 = λ1 + Δλ13;

    return new LatLng(this.toDegrees(φ3), (this.toDegrees(λ3) + 540) % 360 - 180); // normalise to −180..+180°
  };

  drawStep(meters, bearing, position, map) {
    var destination = this.traceDestinationPoint(position, meters, bearing);

    var impactP = new google.maps.Polyline({
      map: map,
      path: [new google.maps.LatLng(position.lat, position.lng),
      new google.maps.LatLng(destination.lat, destination.lng)
      ],
      strokeColor: "cyan",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    /* var markerDest = new google.maps.Marker({
        position: new google.maps.LatLng(destination.lat, destination.lng),
        map: map
    }); */

    return destination;
  }

  useSearchBox(map, input_id) {
    var input = document.getElementById(input_id);
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

    // Manda los resultados del cuadro de búsqueda hacia la ventana de mapas actual
    map.addListener('bounds_changed', () => {
      searchBox.setBounds(map.getBounds());
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
          map: map,
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
      map.fitBounds(bounds);
    });
  }

  drawRectangleRoute(map, poly) {

    let instructions = "ELEVATE TO 20 m";
    const CAMERA_TAKE = {
      heigth: 60,
      width: 100
    }

    var rectangleBorders = {
      northEast: {
        lat: poly.getBounds().getNorthEast().lat(),
        lng: poly.getBounds().getNorthEast().lng()
      },
      southWest: {
        lat: poly.getBounds().getSouthWest().lat(),
        lng: poly.getBounds().getSouthWest().lng()
      },
      southEast: {},
      northWest: {}
    }

    rectangleBorders.southEast = this.objectToJSON(this.intersection(LatLng.objectToLatLng(rectangleBorders.southWest),
    this.cardinalPoints.east,
    LatLng.objectToLatLng(rectangleBorders.northEast),
    this.cardinalPoints.south));

    rectangleBorders.northWest = this.objectToJSON(this.intersection(LatLng.objectToLatLng(rectangleBorders.northEast),
    this.cardinalPoints.west,
    LatLng.objectToLatLng(rectangleBorders.southWest),
    this.cardinalPoints.north));

    var direction = this.cardinalPoints.south;
    var last_direction;
    let home = rectangleBorders.northEast;
    let dronePosition = home;

    var distance_width = this.getDistanceBetweenPoints(rectangleBorders.northWest, rectangleBorders.northEast) * 1000;
    var distance_height = this.getDistanceBetweenPoints(rectangleBorders.northWest, rectangleBorders.southWest) * 1000;


    dronePosition = this.drawStep(CAMERA_TAKE.width / 2, this.cardinalPoints.west, dronePosition, map);

    var distance_traveled = CAMERA_TAKE.width / 2;
    var step;

    while (distance_traveled + CAMERA_TAKE.width <= distance_width) {
      step = (direction == this.cardinalPoints.west) ? CAMERA_TAKE.width : distance_height;
      if (direction == this.cardinalPoints.west && distance_traveled + step > distance_width) {
        step = distance_width - distance_traveled;
      }

      dronePosition = this.drawStep(step, direction, dronePosition, map);
      instructions += `\nGO TO lat: ${dronePosition.lat}, lng: ${dronePosition.lng}`;

      if (direction == this.cardinalPoints.west) {
        distance_traveled += CAMERA_TAKE.width;
      }

      if (direction != this.cardinalPoints.west) {
        last_direction = direction;
        direction = this.cardinalPoints.west;
      } else {
        direction = (last_direction == this.cardinalPoints.south) ? this.cardinalPoints.north : this.cardinalPoints.south;
      }
    };

    direction = (last_direction == this.cardinalPoints.south) ? this.cardinalPoints.north : this.cardinalPoints.south;
    step = (direction == this.cardinalPoints.west) ? CAMERA_TAKE.width : distance_height;
    dronePosition = this.drawStep(step, direction, dronePosition, map);
    instructions += `\nGO TO lat: ${dronePosition.lat}, lng: ${dronePosition.lng}`;

    // Regreso a casa
    var return_to_home = new google.maps.Polyline({
      map: map,
      path: [dronePosition,
        home
      ],
      strokeColor: "#00FF00",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    dronePosition = home;

    instructions += `\nRETURN TO lat: ${dronePosition.lat}, lng: ${dronePosition.lng}`;

    return instructions;

  }

  objectToJSON(obj) {
    let result = JSON.stringify(obj);
    result = JSON.parse(result);
    return result;
  }

  toRadians(x) {
    return x * Math.PI / 180;
  }

  toDegrees(x) {
    return x * 180 / Math.PI;
  }

}
