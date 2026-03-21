import React, { useState, useEffect } from "react";
import {
  Text,
  Flex,
  Box,
  Tag,
  Alert,
  LoadingSpinner,
  Link,
  Divider,
  EmptyState,
  Image,
  StatusTag,
  Tile,
  Panel,
  PanelBody,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  Button,
  Toggle,
  Heading,
} from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";

const API_BASE = "https://bp-matching-api.vercel.app";

const STAR_DISPLAY: Record<number, string> = {
  1: "★",
  2: "★★",
  3: "★★★",
  4: "★★★★",
  5: "★★★★★",
};

interface BKProfil {
  anrede: string;
  vorname: string;
  nachname: string;
  spitzname: string;
  geburtsdatum: string;
  alter: string;
  familienstand: string;
  kinder: string;
  land: string;
  email: string;
  handynummer: string;
  beschreibung: string;
  kategorie: string;
  deutschkenntnisse: string;
  verfuegbarAb: string;
  raucher: string;
  zigarettenAmTag: string;
  fuehrerschein: string;
  pflegeerfahrungJahre: string;
  erfahrung: string;
  transferKg: string;
  letzteEinsaetze: string;
  ausbildungen: string;
  sonstigeAusbildung: string;
  zertifikate: string;
}

interface BKResult {
  contactId: string;
  name: string;
  score: number;
  stars: number;
  kategorie: string;
  deutsch: string;
  verfuegbarAb: string;
  agentur: string;
  erfahrungen: string[];
  avatarUrl: string;
  einsatzStatus: "frei" | "geplant" | "laeuft";
  profil: BKProfil;
  link: string;
  details: Record<string, any>;
}

interface MatchResponse {
  results: BKResult[];
  empty?: boolean;
  message?: string;
  meta?: {
    totalBKs: number;
    shown: number;
    dealComplete: boolean;
    kategorie?: string;
  };
  error?: string;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "–";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const formatDeutsch = (value: string): string => {
  if (!value) return "–";
  const clean = value.replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const getStatusTag = (
  status: string
): { label: string; variant: "success" | "warning" | "danger" } => {
  switch (status) {
    case "laeuft":
      return { label: "Im Einsatz", variant: "danger" };
    case "geplant":
      return { label: "Geplant", variant: "warning" };
    default:
      return { label: "Frei", variant: "success" };
  }
};

const formatJaNein = (value: string): string => {
  if (!value) return "";
  const v = value.toLowerCase().trim();
  if (v === "false" || v === "0" || v === "nein") return "Nein";
  if (v === "true" || v === "1" || v === "ja") return "Ja";
  return value;
};

const getScoreVariant = (
  score: number
): "success" | "warning" | "error" => {
  if (score > 75) return "success";
  if (score >= 51) return "warning";
  return "error";
};

function BKMatchingCard({ context }: { context: any }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [nurFreie, setNurFreie] = useState(false);

  const dealId = context?.crm?.objectId;

  const loadData = async () => {
    if (!dealId) {
      setError("Keine Deal-ID gefunden");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await hubspot.fetch(
        `${API_BASE}/api/bk-match?dealId=${dealId}`
      );
      const json: MatchResponse = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Matching-Daten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dealId]);

  if (loading) {
    return (
      <Flex direction="column" align="center" gap="sm">
        <LoadingSpinner label="Matching wird berechnet…" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert title="Fehler" variant="error">
        {error}
      </Alert>
    );
  }

  if (!data || data.empty) {
    return (
      <EmptyState title={data?.message || "Keine Daten"} layout="vertical">
        <Text>
          {data?.meta?.dealComplete === false
            ? "Bitte füllen Sie das Matching-Profil im Deal aus, um passende Betreuungskräfte zu finden."
            : "Es wurden keine passenden Betreuungskräfte gefunden."}
        </Text>
      </EmptyState>
    );
  }

  const { results, meta } = data;
  const filtered = nurFreie
    ? results.filter((bk) => bk.einsatzStatus === "frei")
    : results;

  return (
    <Flex direction="column" gap="md">
      {/* Header */}
      <Flex direction="row" justify="between" align="center">
        <Text format={{ fontWeight: "bold" }}>
          BK Matching — {meta?.kategorie || ""}
        </Text>
        <Flex direction="row" gap="sm" align="center">
          <Toggle
            checked={nurFreie}
            label="Nur Freie"
            size="sm"
            onChange={(checked) => setNurFreie(checked)}
          />
          <Text variant="microcopy">
            {filtered.length} von {meta?.totalBKs} angezeigt
          </Text>
        </Flex>
      </Flex>

      <Divider />

      {/* Ergebnis-Tiles */}
      {filtered.map((bk) => (
        <Tile key={bk.contactId} compact={true}>
          {/* Obere Zeile: Avatar + Name/Score + Details-Button */}
          <Flex direction="row" justify="between" align="center" gap="md">
            <Flex direction="row" gap="sm" align="center">
              {bk.avatarUrl && (
                <Image
                  src={bk.avatarUrl}
                  alt={bk.name}
                  width={40}
                  height={40}
                />
              )}
              <Link href={bk.link}>
                <Text format={{ fontWeight: "bold" }}>{bk.name}</Text>
              </Link>
              <Tag variant={getScoreVariant(bk.score)}>
                {bk.score}%
              </Tag>
              {bk.stars > 0 && (
                <Text>{STAR_DISPLAY[bk.stars]}</Text>
              )}
              <StatusTag variant={getStatusTag(bk.einsatzStatus).variant}>
                {getStatusTag(bk.einsatzStatus).label}
              </StatusTag>
            </Flex>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {}}
              overlay={
                <Panel id={`panel-${bk.contactId}`} title={bk.name} width="lg">
                  <PanelBody>
                    {/* Header: Foto + Score + Status */}
                    <PanelSection>
                      <Flex direction="column" gap="md">
                        {bk.avatarUrl && (
                          <Flex direction="row" justify="center">
                            <Image src={bk.avatarUrl} alt={bk.name} width={120} height={120} />
                          </Flex>
                        )}
                        <Flex direction="row" gap="sm" justify="center" align="center">
                          <Tag variant={getScoreVariant(bk.score)}>{bk.score}%</Tag>
                          {bk.stars > 0 && <Text>{STAR_DISPLAY[bk.stars]}</Text>}
                          <StatusTag variant={getStatusTag(bk.einsatzStatus).variant}>
                            {getStatusTag(bk.einsatzStatus).label}
                          </StatusTag>
                        </Flex>
                        {bk.agentur && (
                          <Flex direction="row" justify="center">
                            <Heading>{bk.agentur}</Heading>
                          </Flex>
                        )}
                      </Flex>
                    </PanelSection>

                    {/* Persönliche Daten — 2 Spalten */}
                    <PanelSection>
                      <Text format={{ fontWeight: "bold" }}>Persönliche Daten</Text>
                      <Flex direction="row" gap="lg">
                        <Box flex={1}>
                          <DescriptionList direction="column">
                            {bk.profil.anrede && (
                              <DescriptionListItem label="Anrede">
                                <Text>{bk.profil.anrede}</Text>
                              </DescriptionListItem>
                            )}
                            <DescriptionListItem label="Vorname">
                              <Text>{bk.profil.vorname || "–"}</Text>
                            </DescriptionListItem>
                            <DescriptionListItem label="Nachname">
                              <Text>{bk.profil.nachname || "–"}</Text>
                            </DescriptionListItem>
                            {bk.profil.spitzname && (
                              <DescriptionListItem label="Spitzname">
                                <Text>{bk.profil.spitzname}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.geburtsdatum && (
                              <DescriptionListItem label="Geburtsdatum">
                                <Text>{formatDate(bk.profil.geburtsdatum)}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.alter && (
                              <DescriptionListItem label="Alter">
                                <Text>{bk.profil.alter} Jahre</Text>
                              </DescriptionListItem>
                            )}
                          </DescriptionList>
                        </Box>
                        <Box flex={1}>
                          <DescriptionList direction="column">
                            {bk.profil.familienstand && (
                              <DescriptionListItem label="Familienstand">
                                <Text>{bk.profil.familienstand}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.kinder && (
                              <DescriptionListItem label="Kinder">
                                <Text>{bk.profil.kinder}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.land && (
                              <DescriptionListItem label="Land">
                                <Text>{bk.profil.land}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.email && (
                              <DescriptionListItem label="E-Mail">
                                <Text>{bk.profil.email}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.handynummer && (
                              <DescriptionListItem label="Handynummer">
                                <Text>{bk.profil.handynummer}</Text>
                              </DescriptionListItem>
                            )}
                          </DescriptionList>
                        </Box>
                      </Flex>
                      {bk.profil.beschreibung && (
                        <DescriptionList direction="column">
                          <DescriptionListItem label="Über mich">
                            <Text>{bk.profil.beschreibung}</Text>
                          </DescriptionListItem>
                        </DescriptionList>
                      )}
                    </PanelSection>

                    {/* Betreuungsprofil — 2 Spalten */}
                    <PanelSection>
                      <Text format={{ fontWeight: "bold" }}>Betreuungsprofil</Text>
                      <Flex direction="row" gap="lg">
                        <Box flex={1}>
                          <DescriptionList direction="column">
                            <DescriptionListItem label="Kategorie">
                              <Text>{bk.profil.kategorie || "–"}</Text>
                            </DescriptionListItem>
                            <DescriptionListItem label="Deutschkenntnisse">
                              <Text>{formatDeutsch(bk.profil.deutschkenntnisse)}</Text>
                            </DescriptionListItem>
                            <DescriptionListItem label="Verfügbar ab">
                              <Text>{formatDate(bk.verfuegbarAb)}</Text>
                            </DescriptionListItem>
                          </DescriptionList>
                        </Box>
                        <Box flex={1}>
                          <DescriptionList direction="column">
                            {bk.profil.raucher && (
                              <DescriptionListItem label="Raucher">
                                <Text>{formatJaNein(bk.profil.raucher)}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.zigarettenAmTag && (
                              <DescriptionListItem label="Zigaretten/Tag">
                                <Text>{bk.profil.zigarettenAmTag}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.fuehrerschein && (
                              <DescriptionListItem label="Führerschein">
                                <Text>{formatJaNein(bk.profil.fuehrerschein)}</Text>
                              </DescriptionListItem>
                            )}
                          </DescriptionList>
                        </Box>
                      </Flex>
                    </PanelSection>

                    {/* Ausbildung — 2 Spalten */}
                    <PanelSection>
                      <Text format={{ fontWeight: "bold" }}>Ausbildung</Text>
                      <Flex direction="row" gap="lg">
                        <Box flex={1}>
                          <DescriptionList direction="column">
                            {bk.profil.ausbildungen && (
                              <DescriptionListItem label="Ausbildungen">
                                <Text>{bk.profil.ausbildungen.replace(/;/g, ", ")}</Text>
                              </DescriptionListItem>
                            )}
                            {bk.profil.sonstigeAusbildung && (
                              <DescriptionListItem label="Sonstige">
                                <Text>{bk.profil.sonstigeAusbildung}</Text>
                              </DescriptionListItem>
                            )}
                          </DescriptionList>
                        </Box>
                        <Box flex={1}>
                          <DescriptionList direction="column">
                            {bk.profil.zertifikate && (
                              <DescriptionListItem label="Zertifikate">
                                <Flex direction="row" gap="xs" wrap="wrap">
                                  {bk.profil.zertifikate.split(";").map((z: string) => (
                                    <Tag key={z.trim()} variant="default">
                                      {z.trim()}
                                    </Tag>
                                  ))}
                                </Flex>
                              </DescriptionListItem>
                            )}
                          </DescriptionList>
                        </Box>
                      </Flex>
                    </PanelSection>

                    {/* Erfahrung — 1 Spalte (volle Breite) */}
                    <PanelSection>
                      <Text format={{ fontWeight: "bold" }}>Erfahrung</Text>
                      <DescriptionList direction="column">
                        {bk.profil.pflegeerfahrungJahre && (
                          <DescriptionListItem label="Pflegeerfahrung">
                            <Text>{bk.profil.pflegeerfahrungJahre} Jahre</Text>
                          </DescriptionListItem>
                        )}
                        <DescriptionListItem label="Erfahrungen">
                          {bk.profil.erfahrung ? (
                            <Flex direction="row" gap="xs" wrap="wrap">
                              {bk.profil.erfahrung.split(";").map((erf: string) => (
                                <Tag key={erf.trim()} variant="default">
                                  {erf.trim()}
                                </Tag>
                              ))}
                            </Flex>
                          ) : (
                            <Text>–</Text>
                          )}
                        </DescriptionListItem>
                        {bk.profil.transferKg && (
                          <DescriptionListItem label="Transfer bis">
                            <Text>{bk.profil.transferKg} kg</Text>
                          </DescriptionListItem>
                        )}
                        {bk.profil.letzteEinsaetze && (
                          <DescriptionListItem label="Letzte Einsätze">
                            <Flex direction="column" gap="xs">
                              {bk.profil.letzteEinsaetze.split("\n").filter(Boolean).map((line: string, i: number) => (
                                <Text key={i}>{line}</Text>
                              ))}
                            </Flex>
                          </DescriptionListItem>
                        )}
                      </DescriptionList>
                    </PanelSection>

                    {/* Kontakt öffnen */}
                    <PanelSection>
                      <Link href={bk.link}>
                        <Button variant="primary" size="sm">
                          Kontakt öffnen
                        </Button>
                      </Link>
                    </PanelSection>
                  </PanelBody>
                </Panel>
              }
            >
              Details
            </Button>
          </Flex>

          {/* Untere Zeile: Agentur + Deutsch + Verfügbar + Erfahrungen */}
          <Flex direction="row" gap="md" wrap="wrap" align="center">
            {bk.agentur && (
              <Text variant="microcopy">{bk.agentur}</Text>
            )}
            {bk.deutsch && (
              <Text variant="microcopy">Deutsch: {formatDeutsch(bk.deutsch)}</Text>
            )}
            {bk.verfuegbarAb && (
              <Text variant="microcopy">Verfügbar: {formatDate(bk.verfuegbarAb)}</Text>
            )}
            {bk.erfahrungen.length > 0 &&
              bk.erfahrungen.map((erf) => (
                <Tag key={erf} variant="default">
                  {erf}
                </Tag>
              ))}
          </Flex>
        </Tile>
      ))}
    </Flex>
  );
}

// HubSpot Entry Point
hubspot.extend<"crm.record.tab">(({ context }) => (
  <BKMatchingCard context={context} />
));
