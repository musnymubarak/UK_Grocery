class StoreLocation {
  const StoreLocation({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.postcode,
    required this.openUntil,
    required this.isOpen,
    required this.minOrderValue,
    required this.freeDeliveryThreshold,
    required this.distanceMiles,
    this.defaultDeliveryFee = 0,
    this.lat,
    this.lng,
    this.logoUrl,
    this.bannerUrl,
  });

  final String id;
  final String name;
  final String address;
  final String city;
  final String postcode;
  final String openUntil;
  final bool isOpen;
  final double minOrderValue;
  final double freeDeliveryThreshold;
  final double distanceMiles;
  final double defaultDeliveryFee;
  final double? lat;
  final double? lng;
  final String? logoUrl;
  final String? bannerUrl;

  StoreLocation copyWith({double? distanceMiles, bool? isOpen}) {
    return StoreLocation(
      id: id,
      name: name,
      address: address,
      city: city,
      postcode: postcode,
      openUntil: openUntil,
      isOpen: isOpen ?? this.isOpen,
      minOrderValue: minOrderValue,
      freeDeliveryThreshold: freeDeliveryThreshold,
      distanceMiles: distanceMiles ?? this.distanceMiles,
      defaultDeliveryFee: defaultDeliveryFee,
      lat: lat,
      lng: lng,
      logoUrl: logoUrl,
      bannerUrl: bannerUrl,
    );
  }

  factory StoreLocation.fromJson(Map<String, dynamic> json) {
    return StoreLocation(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Store',
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      postcode: json['postcode'] as String? ?? '',
      openUntil: '22:00', // backend doesn't expose this — use a sensible default
      isOpen: json['is_open'] as bool? ?? true,
      minOrderValue: (json['min_order_value'] as num?)?.toDouble() ?? 0.0,
      freeDeliveryThreshold:
          (json['free_delivery_threshold'] as num?)?.toDouble() ?? 30.0,
      distanceMiles: 0.0, // computed client-side from lat/lng when needed
      defaultDeliveryFee: (json['delivery_fee'] as num?)?.toDouble() ?? 0.0,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      logoUrl: json['logo_url'] as String?,
      bannerUrl: json['banner_url'] as String?,
    );
  }
}
