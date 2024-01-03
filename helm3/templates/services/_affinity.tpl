{{- define "affinity" }}
      tolerations:
      - key: "dummy-pod"
        operator: "Exists"
        effect: "NoSchedule"
      nodeSelector:
        node_type: unified
      affinity:
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                  - key: affinitylabel
                    operator: In
                    values:
                      - resource-dummy-pod
              topologyKey: kubernetes.io/hostname
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: affinitylabel
                    operator: In
                    values:
                      - {{ .Chart.Name }}-{{ .Values.username }}
              topologyKey: kubernetes.io/hostname
{{- end }}