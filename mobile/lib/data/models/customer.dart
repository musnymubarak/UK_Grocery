import 'address.dart';

class Customer {
  const Customer({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.addresses = const [],
  });

  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final List<DeliveryAddress> addresses;

  String get initials {
    final n = fullName.trim();
    if (n.isEmpty) return 'DG';
    final parts = n.split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  factory Customer.fromJson(Map<String, dynamic> json) {
    final addrRaw = json['addresses'] as List<dynamic>? ?? const [];
    return Customer(
      id: (json['id'] ?? '').toString(),
      email: json['email'] as String? ?? '',
      fullName: json['full_name'] as String? ?? json['name'] as String? ?? '',
      phone: json['phone'] as String?,
      addresses: addrRaw
          .whereType<Map<String, dynamic>>()
          .map(DeliveryAddress.fromJson)
          .toList(),
    );
  }

  Customer copyWith({String? fullName, String? phone, List<DeliveryAddress>? addresses}) {
    return Customer(
      id: id,
      email: email,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      addresses: addresses ?? this.addresses,
    );
  }
}
