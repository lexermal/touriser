{{- define "touriser.labels" -}}
app.kubernetes.io/name: touriser
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "touriser.selectorLabels" -}}
app.kubernetes.io/name: touriser
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
