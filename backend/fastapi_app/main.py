from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="SIMU_MES Process Simulator", version="1.0.0")

class DREData(BaseModel):
    custo_fixo: float
    margem_contribuicao_pct: float
    metas_sócios: float
    depreciacao: float

@app.get("/")
def read_root():
    return {"message": "Process Simulator API is running"}

@app.post("/calculate-pe/")
def calculate_pe(data: DREData):
    """RF-GOV-02: Cálculo de Pontos de Equilíbrio"""
    if data.margem_contribuicao_pct <= 0:
        return {"error": "Margem de contribuição deve ser maior que 0"}
        
    mc_decimal = data.margem_contribuicao_pct / 100.0
    
    peo = data.custo_fixo / mc_decimal
    pee = (data.custo_fixo + data.metas_sócios) / mc_decimal
    pef = ((data.custo_fixo + data.metas_sócios) - data.depreciacao) / mc_decimal
    
    return {
        "PEO": round(peo, 2),
        "PEE": round(pee, 2),
        "PEF": round(pef, 2)
    }

@app.post("/simulate-scenario/")
def simulate_scenario(data: DREData, novo_capex: float, novo_custo_fixo: float):
    """RF-GOV-05: Simulador de Cenários"""
    # Clona DRE e aplica os novos custos
    sim_data = DREData(
        custo_fixo=data.custo_fixo + novo_custo_fixo,
        margem_contribuicao_pct=data.margem_contribuicao_pct,
        metas_sócios=data.metas_sócios,
        depreciacao=data.depreciacao + (novo_capex * 0.1) # Simulando depreciação do CAPEX em 10%
    )
    return calculate_pe(sim_data)
