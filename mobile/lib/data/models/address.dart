class DeliveryAddress {
  const DeliveryAddress({
    required this.id,
    required this.label,
    required this.line1,
    required this.line2,
    required this.city,
    required this.postcode,
    this.isDefault = false,
  });

  final String id;
  final String label;
  final String line1;
  final String line2;
  final String city;
  final String postcode;
  final bool isDefault;

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    // Backend returns flat `street` while UI splits into line1/line2.
    final street = (json['street'] as String? ?? '').trim();
    final split = street.split(',').map((s) => s.trim()).toList();
    final line1 = split.isNotEmpty ? split.first : '';
    final line2 = split.length > 1 ? split.sublist(1).join(', ') : '';
    return DeliveryAddress(
      id: (json['id'] ?? '').toString(),
      label: json['label'] as String? ?? (json['is_default'] == true ? 'Home' : 'Saved'),
      line1: line1,
      line2: line2,
      city: json['city'] as String? ?? '',
      postcode: json['postcode'] as String? ?? '',
      isDefault: json['is_default'] as bool? ?? false,
    );
  }
}
