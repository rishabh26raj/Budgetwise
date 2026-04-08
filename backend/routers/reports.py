from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from backend import database, auth
from datetime import datetime
import io

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"]
)


@router.get("/export-pdf")
def export_pdf(current_user: dict = Depends(auth.get_current_user)):
    """Generate a PDF financial summary report and return it as a download."""
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        # Fetch data
        uid = current_user['uid']
        expenses_ref = db.collection('users').document(uid).collection('expenses')
        docs = expenses_ref.stream()
        expenses = [doc.to_dict() for doc in docs]

        budget_doc = db.collection('users').document(uid).collection('budget').document('current').get()
        budget = budget_doc.to_dict().get('amount', 0) if budget_doc.exists else 0
        user_name = current_user.get('username', current_user.get('email', 'User'))

        # Compute stats
        total_spent = sum(e.get('amount', 0) for e in expenses)
        remaining = budget - total_spent
        savings_rate = round(((budget - total_spent) / budget) * 100, 1) if budget > 0 else 0

        cat_totals: dict = {}
        for e in expenses:
            cat = e.get('category', 'Other')
            cat_totals[cat] = cat_totals.get(cat, 0) + e.get('amount', 0)

        # Build PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "Title", parent=styles["Heading1"],
            fontSize=22, textColor=colors.HexColor("#4F46E5"),
            spaceAfter=4, alignment=TA_CENTER
        )
        subtitle_style = ParagraphStyle(
            "Sub", parent=styles["Normal"],
            fontSize=11, textColor=colors.HexColor("#6B7280"),
            alignment=TA_CENTER, spaceAfter=16
        )
        section_style = ParagraphStyle(
            "Section", parent=styles["Heading2"],
            fontSize=13, textColor=colors.HexColor("#1F2937"),
            spaceBefore=16, spaceAfter=6
        )
        body_style = styles["Normal"]

        elements = []

        # Header
        elements.append(Paragraph("💰 BudgetWise", title_style))
        elements.append(Paragraph(
            f"Financial Report for {user_name} — Generated {datetime.now().strftime('%d %B %Y')}",
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB")))
        elements.append(Spacer(1, 0.4 * cm))

        # Summary
        elements.append(Paragraph("📊 Summary", section_style))
        summary_data = [
            ["Metric", "Value"],
            ["Monthly Budget", f"Rs {budget:,.2f}"],
            ["Total Spent", f"Rs {total_spent:,.2f}"],
            ["Remaining Balance", f"Rs {remaining:,.2f}"],
            ["Savings Rate", f"{savings_rate}%"],
            ["Total Transactions", str(len(expenses))],
        ]
        summary_table = Table(summary_data, colWidths=[9 * cm, 8 * cm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F9FAFB"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("FONTSIZE", (0, 1), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.4 * cm))

        # Category breakdown
        elements.append(Paragraph("🗂️ Spending by Category", section_style))
        cat_data = [["Category", "Amount (Rs)", "% of Total"]]
        for cat, amount in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True):
            pct = round((amount / total_spent) * 100, 1) if total_spent > 0 else 0
            cat_data.append([cat, f"Rs {amount:,.2f}", f"{pct}%"])

        cat_table = Table(cat_data, colWidths=[7 * cm, 6 * cm, 4 * cm])
        cat_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7C3AED")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F5F3FF"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(cat_table)
        elements.append(Spacer(1, 0.4 * cm))

        # Recent transactions (last 20)
        elements.append(Paragraph("📋 Recent Transactions", section_style))
        recent = sorted(expenses, key=lambda x: x.get('date', ''), reverse=True)[:20]
        tx_data = [["Date", "Title", "Category", "Amount (Rs)"]]
        for e in recent:
            try:
                d = datetime.fromisoformat(e['date']).strftime('%d %b %Y')
            except Exception:
                d = e.get('date', '')[:10]
            tx_data.append([d, e.get('title', '')[:30], e.get('category', ''), f"Rs {e.get('amount',0):,.2f}"])

        tx_table = Table(tx_data, colWidths=[3.5 * cm, 6.5 * cm, 4 * cm, 3 * cm])
        tx_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0EA5E9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (3, 0), (3, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F0F9FF"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(tx_table)

        # Footer
        elements.append(Spacer(1, 0.6 * cm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB")))
        elements.append(Paragraph(
            "Generated by BudgetWise AI — Your Smart Personal Finance Companion",
            ParagraphStyle("footer", parent=styles["Normal"], fontSize=8,
                           textColor=colors.HexColor("#9CA3AF"), alignment=TA_CENTER, spaceBefore=6)
        ))

        doc.build(elements)
        buffer.seek(0)

        filename = f"budgetwise_report_{datetime.now().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="reportlab is not installed. Run: pip install reportlab"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
