/// A server-authored tap target for a home-layout item.
///
/// Mirrors the backend `SectionAction` shape:
/// `{ type: "category"|"product"|"search"|"offers"|"url"|"none", value, label }`.
/// The client maps [type] to a navigation intent — see
/// `core/router/action_router.dart`.
class SectionAction {
  const SectionAction({
    required this.type,
    this.value,
    this.label,
  });

  final String type;
  final String? value;
  final String? label;

  factory SectionAction.fromJson(Map<String, dynamic> json) {
    return SectionAction(
      type: (json['type'] as String? ?? 'none').trim().isEmpty
          ? 'none'
          : json['type'] as String,
      value: json['value'] as String?,
      label: json['label'] as String?,
    );
  }
}
