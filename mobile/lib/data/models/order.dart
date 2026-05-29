import 'product.dart';

enum OrderStatus { placed, confirmed, picking, dispatched, delivered, cancelled }

extension OrderStatusX on OrderStatus {
  String get label => switch (this) {
        OrderStatus.placed => 'Order placed',
        OrderStatus.confirmed => 'Confirmed',
        OrderStatus.picking => 'Being picked',
        OrderStatus.dispatched => 'Out for delivery',
        OrderStatus.delivered => 'Delivered',
        OrderStatus.cancelled => 'Cancelled',
      };
}

OrderStatus _parseStatus(String? raw) {
  switch ((raw ?? '').toLowerCase()) {
    case 'confirmed':
      return OrderStatus.confirmed;
    case 'picking':
      return OrderStatus.picking;
    case 'dispatched':
    case 'out_for_delivery':
      return OrderStatus.dispatched;
    case 'delivered':
      return OrderStatus.delivered;
    case 'cancelled':
    case 'rejected':
      return OrderStatus.cancelled;
    case 'placed':
    default:
      return OrderStatus.placed;
  }
}

class OrderLine {
  const OrderLine({
    required this.product,
    required this.qty,
    this.productName,
    this.unitPrice,
  });
  final Product? product;
  final int qty;
  final String? productName;
  final double? unitPrice;

  double get subtotal => (unitPrice ?? product?.effectivePrice ?? 0) * qty;
  String get nameOrFallback => productName ?? product?.name ?? 'Item';

  factory OrderLine.fromJson(Map<String, dynamic> json) {
    return OrderLine(
      product: null,
      qty: (json['quantity'] as num?)?.toInt() ?? 1,
      productName: json['product_name'] as String? ?? json['name'] as String?,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ??
          (json['price'] as num?)?.toDouble(),
    );
  }
}

class OrderSummary {
  const OrderSummary({
    required this.id,
    required this.orderNumber,
    required this.placedAt,
    required this.status,
    required this.lines,
    required this.deliveryFee,
    required this.tip,
    this.discount = 0,
    this.subtotalOverride,
    this.totalOverride,
  });

  final String id;
  final String orderNumber;
  final DateTime placedAt;
  final OrderStatus status;
  final List<OrderLine> lines;
  final double deliveryFee;
  final double tip;
  final double discount;
  final double? subtotalOverride;
  final double? totalOverride;

  double get subtotal =>
      subtotalOverride ?? lines.fold(0, (s, l) => s + l.subtotal);
  double get total =>
      totalOverride ?? subtotal + deliveryFee + tip - discount;
  int get itemCount => lines.fold(0, (s, l) => s + l.qty);

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    final itemsRaw = (json['items'] as List<dynamic>? ?? const []);
    final placedAtRaw = json['created_at'] as String? ?? json['placed_at'] as String?;
    return OrderSummary(
      id: json['id'] as String,
      orderNumber: json['order_number'] as String? ?? json['id'] as String,
      placedAt: placedAtRaw != null
          ? DateTime.tryParse(placedAtRaw)?.toLocal() ?? DateTime.now()
          : DateTime.now(),
      status: _parseStatus(json['status'] as String?),
      lines: itemsRaw
          .whereType<Map<String, dynamic>>()
          .map(OrderLine.fromJson)
          .toList(),
      deliveryFee: (json['delivery_fee'] as num?)?.toDouble() ?? 0,
      tip: (json['tip_amount'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      subtotalOverride: (json['subtotal'] as num?)?.toDouble(),
      totalOverride: (json['total'] as num?)?.toDouble(),
    );
  }
}
