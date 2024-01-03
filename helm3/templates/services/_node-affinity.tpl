{{- define "node-affinity" }}
      tolerations:
      - key: "dummy-pod"
        operator: "Exists"
        effect: "NoSchedule"
      nodeSelector:
        node_type: unified
{{- end }}