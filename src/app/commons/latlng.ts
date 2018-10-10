import { MapsLibService } from "../services/maps-lib/maps-lib.service";


let MapsLib: MapsLibService;

export class LatLng {
    lat: number;
    lng: number;
    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }

    bearingTo (point: LatLng) {
        // tanθ = sinΔλ⋅cosφ2 / cosφ1⋅sinφ2 − sinφ1⋅cosφ2⋅cosΔλ
        // see mathforum.org/library/drmath/view/55417.html for derivation

        var φ1 = MapsLib.toRadians(this.lat), φ2 = MapsLib.toRadians(point.lat);
        var Δλ = MapsLib.toRadians((point.lng - this.lng));
        var y = Math.sin(Δλ) * Math.cos(φ2);
        var x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        var θ = Math.atan2(y, x);

        return (MapsLib.toDegrees(θ) + 360) % 360;
    };

    equals (point) {
        if (!(point instanceof LatLng)) throw new TypeError('point is not LatLng object');

        if (this.lat != point.lat) return false;
        if (this.lng != point.lng) return false;

        return true;
    };

    finalBearingTo (point) {
        if (!(point instanceof LatLng)) throw new TypeError('point is not LatLng object');
    
        // get initial bearing from destination point to this point & reverse it by adding 180°
        return ( point.bearingTo(this)+180 ) % 360;
    };

    static objectToLatLng(pos_object) {
        return new LatLng(pos_object.lat, pos_object.lng);
    }
}
